import React, { useEffect } from 'react';
import * as d3 from 'd3';

//import './index.css'; // maybe make a new css if it reallz needs linking to here {% static "css/index.css" %}

function HistogramChart(props) {
  const { data, Gaussian, nBin, width, height } = props;

  useEffect(() => {
    drawChart();
  }, [data, Gaussian, nBin]);

  
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

const xScalefactor = 1000

const xMinValue = d3.min(data, d => (d -0.01) * xScalefactor);
const xMaxValue = d3.max(data, d => (d +0.01) *xScalefactor);

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

//put x and y axis on graph
var xAxis = svg
  .append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0,${height})`)
  .style("font-size", "14px")
  .call(d3.axisBottom().scale(xScale).tickSize(15)); 
var yAxis = svg
  .append('g')
  .style("font-size", "14px")
  .attr('class', 'y-axis')


var histogram = d3.bin()
  .value(d => d * xScalefactor)   // I need to give the vector of value
  .domain(xScale.domain())  // then the domain of the graphic
  .thresholds(xScale.ticks(nBin)); // then the numbers of bins

// apply function to data to get the bins  
var bins = histogram(data);

// Y axis: update now that we know the domain
yScale.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
yAxis
    .transition()
    .duration(1000)
    .call(d3.axisLeft(yScale));

    // Join the rect with the bins data
var u = svg.selectAll("rect")
    .data(bins)

// Manage bin numbers changing
// Existing bars and eventually the new ones:
u
    .enter()
    .append("rect") // Add a new rect for each new elements
    .merge(u) // get the already existing elements as well
    .transition() // and apply changes to all of them
    .duration(300)
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")"; })
        .attr("width", function(d) { return xScale(d.x1) - xScale(d.x0); }) // add a eg -1 at the end of the scale if you want a space between bars
        .attr("height", function(d) { return height - yScale(d.length); })
        .style("fill", "lightBlue")
        .style("opacity", "0.7")


// If less bars on the new histogram, delete the ones not in use anymore
u
    .exit()
    .remove()


// axis labels
svg.append("text")
  .attr("class", "x label")
  .attr("text-anchor", "end")
  .attr("x", width)
  .attr("y", height - 6)
  .attr("font-family", "Arial")
  .style("font-size", "20px")
  .text("Relative Timing (ms)");
  

svg.append("text")
  .attr("class", "y label")
  .attr("text-anchor", "end")
  .attr("y", 6)
  .attr("font-family", "Arial")
  .style("font-size", "24px")
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .text("# Occurances");




  }
  return <div id="container" />;
  
}

export default HistogramChart;