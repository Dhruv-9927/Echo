import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/use-websocket';
import { useApi } from '../hooks/use-api';
import type { KnowledgeGraphData } from '../types';
import './KnowledgeGraph.css';
import { LoadingPulse } from './LoadingPulse';

export function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { data, loading, error } = useApi(api.getGraph);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  
  // Update local state when API data arrives
  useEffect(() => {
    if (data) setGraphData(data);
  }, [data]);

  // Handle WebSocket live updates
  useWebSocket((event, payload) => {
    if (event === 'graph:pulse') {
      const nodeId = payload.nodeId;
      const nodeEl = d3.select(`#node-${nodeId.replace(/:/g, '\\:')}`);
      if (!nodeEl.empty()) {
        const ring = nodeEl.insert('circle', ':first-child')
          .attr('class', 'pulse-ring')
          .attr('r', 10)
          .style('fill', 'none')
          .style('stroke', 'var(--echo-pulse)')
          .style('stroke-width', 2);
          
        ring.transition()
          .duration(1500)
          .ease(d3.easeCubicOut)
          .attr('r', 40)
          .style('opacity', 0)
          .remove();
      }
    }
  });

  useEffect(() => {
    if (!graphData || !containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('*').remove();

    // D3 Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (e) => g.attr('transform', e.transform));
      
    svg.call(zoom);

    const g = svg.append('g');

    // Make copies of data to avoid mutating react state
    const nodes = graphData.nodes.map(d => ({ ...d }));
    const edges = graphData.edges.map(d => ({ ...d }));

    const colorByType = {
      person: 'var(--graph-person-node)',
      concept: 'var(--graph-concept-node)',
      decision: 'var(--graph-decision-node)',
      problem: 'var(--graph-problem-node)',
      solution: 'var(--graph-solution-node)'
    };

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(40));

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'graph-edge')
      .style('stroke-width', (d: any) => Math.min(d.weight, 5))
      .style('stroke', 'var(--graph-edge-strong)')
      .style('opacity', 0.4);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', (d: any) => `graph-node ${d.decayScore < 0.4 ? 'graph-node--decayed' : ''}`)
      .attr('id', (d: any) => `node-${d.id}`)
      .call(d3.drag<any, any>()
        .on('start', (e, d) => {
          if (!e.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (e, d) => {
          d.fx = e.x;
          d.fy = e.y;
        })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    node.append('circle')
      .attr('r', (d: any) => Math.max(10, Math.min(d.mentionCount * 2, 25)))
      .style('fill', (d: any) => colorByType[d.type as keyof typeof colorByType])
      .style('opacity', (d: any) => Math.max(0.3, d.decayScore))
      .style('stroke', (d: any) => d.decayScore < 0.4 ? 'var(--echo-amber)' : 'none')
      .style('stroke-dasharray', (d: any) => d.decayScore < 0.4 ? '4,4' : 'none');

    // Node labels
    node.append('text')
      .text((d: any) => d.label)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('class', 'graph-label text-mono')
      .style('fill', 'var(--echo-text-primary)')
      .style('font-size', '12px');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  if (loading) return <LoadingPulse />;
  if (error) return <div className="text-danger">Failed to load knowledge graph.</div>;

  return (
    <div className="knowledge-graph-container" ref={containerRef}>
      <svg ref={svgRef} className="knowledge-graph-svg"></svg>
    </div>
  );
}
