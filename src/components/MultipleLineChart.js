import React, { useEffect } from 'react';
import * as d3 from 'd3';

//import './index.css'; // maybe make a new css if it reallz needs linking to here {% static "css/index.css" %}

function LineChart(props) {
  const { data, threshold, noteOnsets, ymin, ymax, width, height } = props;

  useEffect(() => {
    drawChart();
  }, [data, threshold, noteOnsets]);

  
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
const yMinValue = ymin;//d3.min(data, d => d.value); // changed from d.value to keep it constant
const yMaxValue = ymax;//d3.max(data, d => d.value);
const xMinValue = d3.min(data, d => d.label);
const xMaxValue = d3.max(data, d => d.label);

//create straight line at threshold (two points)
const thresholdLine = [];
thresholdLine.push({
  label: xMinValue,
  value: threshold,
  tooltipContent: `<b>x: </b>${xMinValue}<br><b>y: </b>${threshold}`,
});
thresholdLine.push({
  label: xMaxValue,
  value: threshold,
  tooltipContent: `<b>x: </b>${xMinValue}<br><b>y: </b>${threshold}`,
});

// set up dataset for plotting multiple lines
var datasets = [
    {
        name: "soundData",
        values: data,
    },
    {
        name: "thresholdLine",
        values: thresholdLine,
    },
    {
        name: "noteOnsets",
        values: noteOnsets,
    }
]

var color = d3.scaleOrdinal(d3.schemeCategory10);

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

var line = d3
  .line()
  .x(d => xScale(d.label))
  .y(d => yScale(d.value))    
  .curve(d3.curveMonotoneX);

let lines = svg.append('g')
    .attr('class', 'lines');

    lines.selectAll('.line-group')
        .data(datasets).enter()
        .append('g')
        .attr('class', 'line-group')  
        .append('path')
        .attr('class', 'line')  
        .attr('d', d => line(d.values))
        .style('stroke', (d, i) => color(i))
        .style('opacity', "0.3")
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        
        
//x and y axis
svg
  .append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0,${height})`)
  .style("font-size", "14px")
  .call(d3.axisBottom().scale(xScale).tickSize(15)); 
svg
  .append('g')
  .attr('class', 'y-axis')
  //.call(d3.axisLeft(yScale)); // this commented 
  .call(d3.axisLeft(yScale).tickValues([])) // the last part turns off the tick value disaply and ticks

// axis labels
svg.append("text")
  .attr("class", "x label")
  .attr("text-anchor", "end")
  .attr("x", width)
  .attr("y", height - 6)
  .attr("font-family", "Arial")
  .style("font-size", "24px")
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
    

  }
  return <div id="container" />;
  
}

export default LineChart;