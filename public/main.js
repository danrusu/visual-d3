const addXAxisLegend = (svg, legendText, width, height) => svg.append("text")
  .attr("class", "x label")
  .attr("text-anchor", "end")
  .attr("x", width)          
  .attr("y", height - 10)
  .text(legendText)
  .style('fill', 'blue');

const addYAxisLegend = (svg, legendText) => svg.append("text")
  .attr("class", "y label")
  .attr("text-anchor", "end")
  .attr("y", 6)
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .text(legendText)
  .style('fill', 'blue');

const displayGraph = (data, {
  margin,
  width,
  height,
  legend,
  xRange,
  yRange,
}) => {
      
    d3.selectAll("svg").remove();
    
    width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

    // append the svg object to the body of the page
      const svg = d3.select("#graphAll")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");	

      const groupNames = data.map(d => d.name);

      // A color scale: one color for each group
      const myColor = d3.scaleOrdinal()
        .domain(groupNames)
        .range(d3.schemeSet2);

      // Add X axis --> it is a date format
      const x = d3.scaleLinear()
        .domain([ xRange.start, xRange.stop ])
        .range([ 0, width ]);
      
      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

      // Add Y axis
      var y = d3.scaleLinear()
        .domain([ yRange.start, yRange.stop ])
        .range([ height, 0 ]);
      
      svg.append("g").call(d3.axisLeft(y));

      // Add the lines
      const line = d3.line()
        .x(d => x(+d.noOfLocations))
        .y(d => y(+d.duration))
      
      svg.selectAll("myLines")
        .data(data)
        .enter()
        .append("path")
          .attr("class", d => d.name)
          .attr("d", d => line(d.values))
          .attr("stroke", d => myColor(d.name))
          .style("stroke-width", 4)
          .style("fill", "none");

      // Add the points
      svg
        // First we need to enter in a group
        .selectAll("myDots")
        .data(data)
        .enter()
          .append('g')
          .style("fill", d => myColor(d.name))
          .attr("class", d => d.name)
        // Second we need to enter in the 'values' part of this group
        .selectAll("myPoints")
        .data(d => d.values)
        .enter()
        .append("circle")
          .attr("cx", d => x(d.noOfLocations))
          .attr("cy", d => y(d.duration))
          .attr("r", 5)
          .attr("stroke", "white");

      // Add a label at the end of each line
      svg
        .selectAll("myLabels")
        .data(data)
        .enter()
          .append('g')
          .append("text")
            .attr("class", d => d.name)
            .datum(d => ({
          name: d.name, 
          value: d.values[d.values.length - 1]
        })
            )	// keep only the last value of each noOfLocations series
            .attr("transform", d => `translate(${x(d.value.noOfLocations)}, ${y(d.value.duration)})`) // Put the text at the position of the last point
            .attr("x", 12) // shift the text a bit more right
            .text(d => d.name)
            .style("fill", d => myColor(d.name))
            .style("font-size", 10);

      // Add a legend (interactive)
      svg
        .selectAll("myLegend")
        .data(data)
        .enter()
          .append('g')
          .append("text")
            .attr('x', (d,i) => 30 + i*120)
            .attr('y', -20)
            .text(d => d.name)
            .style("fill", d => myColor(d.name))
            .style("font-size", 15)
          .on("click", d => {
            // is the element currently visible ?
            currentOpacity = d3.selectAll("." + d.name).style("opacity")
            // Change the opacity: from 0 to 1 or from 1 to 0
            d3.selectAll("." + d.name).transition().style("opacity", currentOpacity == 1 ? 0:1)
          });

      addXAxisLegend(svg, legend.x, width, height);      
      addYAxisLegend(svg, legend.y);
      
};

const displayGraphFromData = async dataName => {   
  const response = await fetch(`/data/${dataName}.json`);
  const data = await response.json();
  console.log(data);

  // set the dimensions and margins of the graph
  const margin = {
    top: 50, 
    right: 100, 
    bottom: 50, 
    left: 100
  };
  const width = 1000;
  const height = 500;
  const legend = {
    x: 'Portfolio size [no. of locations * 1000]',
    y: 'Duration [ms]'
  };
  const xRange = { start: 0, stop: 5000 };
  const yRange = {start: 0, stop: 6000000 };


  displayGraph(data, { 
    margin, 
    width, 
    height,
    legend,
    xRange,
    yRange,
  });
};

const resultTypeOnChange = () => {
  const resultTypeButtons = [].slice.call(document.querySelectorAll('[name="resultType"]'))
    .forEach(resultTypeButton =>
        document.getElementById(`${resultTypeButton.id}TypeTxt`).className = resultTypeButton.checked ?
          'resultTypeSelected'
          : ''          
    );
}