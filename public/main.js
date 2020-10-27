const DISPLAYED_SERIES_COUNT = 5;

const addXAxisLegend = (svg, legendText, width, height) => svg.append("text")
  .attr("class", "x label")
  .attr("text-anchor", "end")
  .attr("x", width)
  .attr("y", height + 40)
  .text(legendText)
  .style('fill', 'blue');

const addYAxisLegend = (svg, legendText) => svg.append("text")
  .attr("class", "y label")
  .attr("text-anchor", "end")
  .attr("y", +10)
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .text(legendText)
  .style('fill', 'blue');

const displayGraph = (containerSelector, data, {
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
  const svg = d3.select(containerSelector)
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
    .domain([xRange.start, xRange.stop])
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([yRange.start, yRange.stop])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  // Add the lines
  const line = d3.line()
    .x(d => x(+d.x))
    .y(d => y(+d.y))

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
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", 5)
    .attr("stroke", "white");

  // Add a label at the end of each line
  /*
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
      )	
      // keep only the last value of each series
      .attr("transform", d => `translate(${x(d.value.x)}, ${y(d.value.y)})`) // Put the text at the position of the last point
      .attr("x", 12) // shift the text a bit more right
      .text(d => d.name)
      .style("fill", d => myColor(d.name))
      .style("font-size", 10);
  */

  // Add a legend (interactive)
  svg
    .selectAll("myLegend")
    .data(data)
    .enter()
    .append('g')
    .append("text")
    .attr('x', (d, i) => 30 + i * 120)
    .attr('y', -20)
    .text(d => d.name)
    .style("fill", d => myColor(d.name))
    .style("font-size", 15)
    .on("click", d => {
      // is the element currently visible ?
      currentOpacity = d3.selectAll("." + d.name).style("opacity")
      // Change the opacity: from 0 to 1 or from 1 to 0
      d3.selectAll("." + d.name).transition().style("opacity", currentOpacity == 1 ? 0 : 1)
    });

  addXAxisLegend(svg, legend.x, width, height);
  addYAxisLegend(svg, legend.y);
};

const getJson = async url => await (await fetch(url)).json();

const getData = async dataType => getJson(`/data/${dataType}.json`);
const getDataTypes = async () => getJson(`/data`);

const displayDataGraph = async data => {

  const { graphSettings, graphData } = data;

  // set the dimensions and margins of the graph
  const margin = {
    top: 50,
    right: 100,
    bottom: 50,
    left: 100
  };

  displayGraph('#dataGraph', filterByIterator(graphData, DISPLAYED_SERIES_COUNT), {
    margin,
    ...graphSettings
  });
};

const filterByIterator = (array, finalSize) => {

  const iteratorSize = (array.length % finalSize) == 0 ?
    array.length / finalSize + 1
    : Math.trunc(array.length / finalSize) + 1;

  const finalArray = [];
  for (let i = 0; i < array.length; i += iteratorSize) {
    finalArray.push(array[i]);
  }

  if (finalArray[finalArray.length - 1] != array[array.length - 1]) {
    finalArray.push(array[array.length - 1]);
  }

  return finalArray;
}

const dataTypeOnChange = () => [].slice.call(document.querySelectorAll('[name="dataType"]'))
  .forEach(dataTypeButton =>
    document.getElementById(`${dataTypeButton.id}TypeTxt`).className = dataTypeButton.checked ?
      'dataTypeSelected'
      : ''
  );

const setDataTypeMenu = async () => {
  const dataTypes = await getDataTypes();

  const getDataTypeMenuHtml = dataType => `
    <span class="menu">  
      <input type="radio" id="${dataType}" name="dataType">
      <span id="${dataType}TypeTxt">${dataType}</span> 
    </span>
  `;

  const dataTypeHtml = dataTypes.map(getDataTypeMenuHtml).join('\n');

  document.getElementById('dataTypeMenu').innerHTML = dataTypeHtml;

  const setDataTypeOnChange = element => element.addEventListener('change', dataTypeOnChange);
  const setDataTypeOnClick = element => element.addEventListener(
    'click',
    () => setPage(element.id)
  );

  const dataTypeButtons = document.querySelectorAll('#dataTypeMenu input');

  dataTypeButtons.forEach(setDataTypeOnChange);
  dataTypeButtons.forEach(setDataTypeOnClick);
  
  const dataTypeToDisplay = dataTypes.includes(localStorage.dataType) ? localStorage.dataType : dataTypes[0];
  document.getElementById(dataTypeToDisplay).click();
};

const displayDataTable = data => {
  const { graphData } = data;
  const dataHeader = getDataHeader(data);
  const dataRows = graphData.map(dataGroupToHtmlRow).join('\n');
  document.getElementById('dataTable').innerHTML = dataHeader + dataRows;
};

const getDataHeader = data => {
  const tableHeaderText = data.graphSettings.legend.x;
  const header = data.graphData[0].values
    .map(value => `<span class="value">${value.x}</span>`)
    .join('');
  return `<div class="header"><span>${tableHeaderText}</span>${header}</div>`
    + `<div class="header"><span>Series</span class="values"><span id="multipleColumnsHeader">Duration [h:m:s.ms]<span></div>`
};

const dataGroupToHtmlRow = dataGroup => {
  const valuesHtml = dataGroup.values
    .map(value => `<span class="value">${msToTimeStr(value.y)}</span>`)
    .join('');

  return `<div><span class="date">${dataGroup.name.slice(1)}</span>${valuesHtml}</div>`
}

const msToTimeObj = durationInMiliseconds => {
  const milliseconds = durationInMiliseconds % 1000;
  let duration = (durationInMiliseconds - milliseconds) / 1000;

  const seconds = duration % 60;
  duration = (duration - seconds) / 60;

  const minutes = duration % 60;

  const hours = (duration - minutes) / 60;

  return {
    hours,
    minutes,
    seconds,
    milliseconds
  };
};

const msToTimeStr = durationInMiliseconds => {
  const { hours, minutes, seconds, milliseconds } = msToTimeObj(durationInMiliseconds);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

const setDataTableHeaderWidth = graphData => {
  const maxValuesCount = Math.max( ...graphData.map(data => data.values.length));
  document.getElementById("multipleColumnsHeader").style.width = `${120 * maxValuesCount - 20}px`;
}

const setPage = async dataType => {
  localStorage.dataType = dataType;
  const data = await getData(dataType);
  const applyAction = data => action => action(data);

  const dataActions = [displayDataGraph, displayDataTable];
  dataActions.forEach(applyAction(data));
  setDataTableHeaderWidth(data.graphData);
}