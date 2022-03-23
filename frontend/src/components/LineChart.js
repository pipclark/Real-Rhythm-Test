import React, { useEffect } from 'react';
import * as d3 from 'd3';

//import './index.css'; // maybe make a new css if it reallz needs linking to here {% static "css/index.css" %}

function LineChart(props) {
  const { data, threshold, width, height } = props;

  useEffect(() => {
    drawChart();
  }, [data, threshold]);

  
function drawChart() {
//wiping old chart before regenerating data
d3.select('#container')
.select('svg')
.remove();
d3.select('#container')
.select('.tooltip')
.remove();
// some constants
const margin = { top: 50, right: 50, bottom: 50, left: 50 };
const yMinValue = d3.min(data, d => d.value);
const yMaxValue = d3.max(data, d => d.value);
const xMinValue = d3.min(data, d => d.label);
const xMaxValue = d3.max(data, d => d.label);

//create straight line at threshold
const thresholdLine = [];
thresholdLine.push({
  label: xMinValue,
  value: threshold,
});
thresholdLine.push({
  label: xMaxValue,
  value: threshold,
});

// svg element
const svg = d3
  .select('#container')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);


//axis scales and sizes
const xScale = d3
  .scaleLinear()
  .domain([xMinValue, xMaxValue])
  .range([0, width]);
const yScale = d3
  .scaleLinear()
  .range([height, 0])
  .domain([yMinValue, yMaxValue]);

const line = d3
  .line()
  .x(d => xScale(d.label))
  .y(d => yScale(d.value))    
  .curve(d3.curveMonotoneX);

//x and y axis
svg
  .append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0,${height})`)
  .call(d3.axisBottom().scale(xScale).tickSize(15)); 
svg
  .append('g')
  .attr('class', 'y-axis')
  .call(d3.axisLeft(yScale));
  //.call(d3.axisLeft(yScale).tickValues([])) // the last part turns off the tick value disaply and ticks

// axis labels
svg.append("text")
  .attr("class", "x label")
  .attr("text-anchor", "end")
  .attr("x", width)
  .attr("y", height - 6)
  .attr("font-family", "Arial")
  .style("font-size", "14px")
  .text("time (s)");
/*
svg.append("text")
  .attr("class", "y label")
  .attr("text-anchor", "end")
  .attr("y", 6)
  .attr("font-family", "Arial")
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .text("Wave Ampltiude");
*/


//plotting data lines
svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#f6c3d0')
    .attr('stroke-width', 4)
    .attr('class', 'line') 
    .attr('d', line);


/*
//tool tip for hovering over graph
const focus = svg
    .append('g')
    .attr('class', 'focus')
    .style('display', 'none');
focus.append('circle').attr('r', 5).attr('class', 'circle');
const tooltip = d3
    .select('#container')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);
*/
    

  }
  return <div id="container" />;
  
}

export default LineChart;