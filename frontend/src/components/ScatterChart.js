import React, { useEffect } from 'react';
import * as d3 from 'd3';

//import './index.css'; // maybe make a new css if it reallz needs linking to here {% static "css/index.css" %}

function ScatterChart(props) {
  const { data, width, height } = props;

  useEffect(() => {
    drawChart();
  }, [data]);

  
function drawChart() {
//wiping old chart before regenerating data
d3.select('#container')
.select('svg')
.remove();
d3.select('#container')
.select('.tooltip')
.remove();
// some constants

const yscalefactor = 1000

const margin = { top: 50, right: 50, bottom: 100, left: 100 };
const yMinValue = d3.min(data, d => d.value *yscalefactor); 
const yMaxValue = d3.max(data, d => d.value *yscalefactor);
const xMinValue = d3.min(data, d => d.label);
const xMaxValue = d3.max(data, d => d.label);


//create straight line at 0 (two points)
const zeroLine = [];
zeroLine.push({
  label: xMinValue,
  value: 0,
  tooltipContent: `<b>x: </b>${xMinValue}<br><b>y: </b>${0}`,
});
zeroLine.push({
  label: xMaxValue,
  value: 0,
  tooltipContent: `<b>x: </b>${xMinValue}<br><b>y: </b>${0}`,
});

// set up dataset for plotting multiple lines
var datasets = [
    {
        name: "soundData",
        values: data,
    },
    {
        name: "zeroLine",
        values: zeroLine,
    },
]

var color = d3.scaleOrdinal(d3.schemeCategory10);

// svg element
var svg = d3
  .select('#container')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g') // used to group svg elements together
  .attr('transform', `translate(${margin.left},${margin.top})`);



//axis scales and sizes
const xScale = d3
  .scaleLinear()
  .domain([xMinValue, xMaxValue])
  .range([0, width]);
const yScale = d3
  .scaleLinear()
  .range([height, 0])
  .domain([yMinValue , yMaxValue]); // convert s to ms


// data on graph
svg.append('g')
    .selectAll('circles')
    .data(data).enter() // 
    //.attr('class', 'line-group')  
    .append('circle')  
      .attr("cx", d => xScale(d.label)) // x position
      .attr("cy", d => yScale(d.value *yscalefactor))
      .attr('r', 4) // radius
      //.attr('d', d => line(d.values))
      //.style('stroke', (d, i) => color(i))
      .attr('opacity', "0.3")
      //.attr('stroke-width', 2)
      .attr('fill', 'blue')
        
// add straight line at 0
svg.append('line')
  .attr('x1', xScale(xMinValue))
  .attr('x2', xScale(xMaxValue))
  .attr('y1', yScale(0))
  .attr('y2', yScale(0))
  .attr('stroke', '#f6c3d0')
  .attr('stroke-width', 4)
  .attr('class', 'line')
  .attr('opacity', "0.7") 
        
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
  .style("font-size", "14px")
  .call(d3.axisLeft(yScale)); // this commented 
  //.call(d3.axisLeft(yScale).tickValues([])) // the last part turns off the tick value disaply and ticks

// axis labels
svg.append("text")
  .attr("class", "x label")
  .attr("text-anchor", "end")
  .attr("x", width/2 +50)
  .attr("y", height + 50)
  .attr("font-family", "Arial")
  .style("font-size", "24px")
  .text("beat number");

svg.append("text")
  .attr("class", "y label")
  .attr("text-anchor", "end")
  .attr("x", 0)
  .attr("y", -60)
  .attr("font-family", "Arial")
  .style("font-size", "24px")
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .text("Relative Note Arrival Time (ms)");

    

  }
  return <div id="container" />;
  
}

export default ScatterChart;