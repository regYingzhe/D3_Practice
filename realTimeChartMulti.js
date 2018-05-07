'use strict';


function realTimeChartMulti() {
  var version = "0.1.0",
      datum, data = [],
      maxSeconds = 300, pixelsPerSecond = 10,
      svgWidth = 700, svgHeight = 300,
      margin = { top: 20, bottom: 20, left: 100, right: 30, topNav: 10, bottomNav: 20 },
      dimension = { chartTitle: 20, xAxis: 20, yAxis: 20, xTitle: 20, yTitle: 20, navChart: 70 },
      maxY = 100, minY = 0,
      chartTitle, yTitle, xTitle,
      drawXAxis = true, drawYAxis = true, drawNavChart = true,
      border,
      selection,
      barId = 0,
      yDomain = [],
      debug = false,
      barWidth = 5,
      halted = false,
      x, y,
      xNav, yNav,
      width, height,
      widthNav, heightNav,
      xAxisG, yAxisG,
      xAxis, yAxis,
      svg;

  // create the chart
  var chart = function(s) {
    selection = s;
    if (selection == undefined) {
      console.error("selection is undefined");
      return;
    };

    // process titles
    chartTitle = chartTitle || "";
    xTitle = xTitle || "";
    yTitle = yTitle || "";

    // compute component dimensions
    var chartTitleDim = chartTitle == "" ? 0 : dimension.chartTitle,
        xTitleDim = xTitle == "" ? 0 : dimension.xTitle,
        yTitleDim = yTitle == "" ? 0 : dimension.yTitle,
        xAxisDim = !drawXAxis ? 0 : dimension.xAxis,
        yAxisDim = !drawYAxis ? 0 : dimension.yAxis,
        navChartDim = !drawNavChart ? 0 : dimension.navChart;

    // compute dimension of main and nav charts, and offsets
    var marginTop = margin.top + chartTitleDim;
    height = svgHeight - marginTop - margin.bottom - chartTitleDim - xTitleDim - xAxisDim - navChartDim + 30;
    heightNav = navChartDim - margin.topNav - margin.bottomNav;
    var marginTopNav = svgHeight - margin.bottom - heightNav - margin.topNav;
    width = svgWidth - margin.left - margin.right;
    widthNav = width;

    // append the svg
    svg = selection.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("border", function(d) { 
          if (border) return "1px solid lightgray"; 
          else return null;
        });
        console.log("inside chart")
    // create main group and translate
    var main = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + marginTop + ")");

    // define clip-path
    main.append("defs").append("clipPath")
        .attr("id", "myClip")
      .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);


    var barG = main.append("g")
        .attr("class", "barGroup")
        .attr("transform", "translate(0, 0)")
        .attr("clip-path", "url(#myClip")
      .append("g");

    // add group for x axis
    xAxisG = main.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    // add group for y axis
    yAxisG = main.append("g")
        .attr("class", "y axis");

    // define main chart scales
    x = d3.time.scale().range([0, width]);
    y = d3.scale.ordinal().domain(yDomain).rangeRoundPoints([height, 0], 1)

    // define main chart axis
    xAxis = d3.svg.axis().orient("bottom");
    yAxis = d3.svg.axis().orient("left");

    // add nav chart
    var nav = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + marginTopNav + ")");

    // add group to data items
    var navG = nav.append("g")
        .attr("class", "nav");

    // add group to hold nav x axis
    // please note that a clip path has yet to be added here (tbd)
    var xAxisGNav = nav.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + heightNav + ")");

    // define nav chart scales
    xNav = d3.time.scale().range([0, widthNav]);
    yNav = d3.scale.ordinal().domain(yDomain)

    // define nav axis
    var xAxisNav = d3.svg.axis().orient("bottom");

    // compute initial time domains...
    var ts = new Date().getTime();
    console.log("ts is ", ts);

    // first, the full time domain
    // var endTime = new Date(ts);
    // console.log("endTime is", endTime);
    // var startTime = new Date(endTime.getTime() - maxSeconds * 1000);
    // console.log("startTime is ", startTime);
    // var interval = endTime.getTime() - startTime.getTime();
    // console.log("Interval is ", interval);

    // // then the viewport time domain (what's visible in the main chart and the viewport in the nav chart)
    // var endTimeViewport = new Date(ts);

    // // console.log("the delta is ", endTime.getTime() - endTimeViewport.getTime());
    // var startTimeViewport = new Date(endTime.getTime() - width / pixelsPerSecond * 1000);
    // console.log("startTimeViewport: ", startTimeViewport)
    // var intervalViewport = endTimeViewport.getTime() - startTimeViewport.getTime();
    // var offsetViewport = startTimeViewport.getTime() - startTime.getTime();
    // console.log("offsetViewPort is: ", offsetViewport);

    // // set the scale domains for main and nav charts
    // x.domain([startTimeViewport, endTimeViewport]);
    // xNav.domain([startTime, endTime]); 

    // // update axis with modified scale
    // xAxis.scale(x)(xAxisG);
    // yAxis.scale(y)(yAxisG);
    // xAxisNav.scale(xNav);

    // var viewport = [startTimeViewport, endTimeViewport];

    var endTimeViewport = new Date();
    var startTime = new Date(endTimeViewport.getTime() - width / pixelsPerSecond * 1000);
    var viewport = [startTime, endTimeViewport];
    x.domain(viewport);

    xAxis.scale(x)(xAxisG);
    yAxis.scale(y)(yAxisG);

    function refresh() {

      // process data to remove too late data items 
      data = data.filter(function(d) {
        if (d.time.getTime() > startTime.getTime()) return true;
      })

      var updateSel = barG.selectAll(".bar")
          .data(data);

      // remove items
      updateSel.exit().remove();

      // add items
      updateSel.enter()
          .append(function(d) { 
            var type = d.type;
            var node = document.createElementNS("http://www.w3.org/2000/svg", type);
            return node; 
          })
          .attr("class", "bar")
          .attr("id", function() { 
            return "bar-" + barId++; 
          });

      // update items; added items are now part of the update selection
      updateSel
          .attr("cx", function(d) { 
            var retVal = null;
            switch (getTagName(this)) {
              case "circle":
                retVal = Math.round(x(d.time));
                break;
              default:
            }
            return retVal; 
          })
          .attr("cy", function(d) { 
            var retVal = null;
            switch (getTagName(this)) {
              case "circle":
                retVal = y(d.category);
                break;
              default:
            }
            return retVal; 
          })
          .attr("r", function(d) { 
            var retVal = null;
            switch (getTagName(this)) {
              case "circle":
                retVal = d.size / 2;
                break;
              default:
            }
            return retVal; 
          })
          .style("fill", function(d) { return d.color || "black"; })
          .style("fill-opacity", function(d) { return d.opacity || 1; });
    } // end refreshChart function

    function getTagName(that) {
      var tagName = d3.select(that).node().tagName;
      return (tagName);
    }

    // function to keep the chart "moving" through time (right to left) 
    setInterval(function() {

      // var extent = viewport;
      // var interval = viewport[1].getTime() - viewport[0].getTime();
      // var offset = viewport[0].getTime() - xNav.domain()[0].getTime();

      // // compute new nav extents
      // endTime = new Date();
      // startTime = new Date(endTime.getTime() - maxSeconds * 1000);

      // // compute new viewport extents 
      // startTimeViewport = new Date(startTime.getTime() + offset);
      // endTimeViewport = new Date(startTimeViewport.getTime() + interval);
      // viewport = [startTimeViewport, endTimeViewport]

      // // update scales
      // x.domain([startTimeViewport, endTimeViewport]);
      // xNav.domain([startTime, endTime]);

      // // update axis
      // xAxis.scale(x)(xAxisG);
      var interval = viewport[1].getTime() - viewport[0].getTime();
      var endTime = new Date();
      var startTimeViewport = new Date(endTime.getTime() - interval);
      viewport = [startTimeViewport, endTime];
      x.domain(viewport);
      xAxis.scale(x)(xAxisG);
      refresh();
    }, 200)
    return chart;
  }

  chart.datum = function(_) {
    if (arguments.length == 0) return datum;
    datum = _;
    data.push(datum);
    return chart;
  }

  // svg width
  chart.width = function(_) {
    if (arguments.length == 0) return svgWidth;
    svgWidth = _;
    return chart;
  }

  // svg height
  chart.height = function(_) {
    if (arguments.length == 0) return svgHeight;
    svgHeight = _;
    return chart;
  }

  // svg border
  chart.border = function(_) {
    if (arguments.length == 0) return border;
    border = _;
    return chart;       
  }

  // chart title
  chart.title = function(_) {
    if (arguments.length == 0) return chartTitle;
    chartTitle = _;
    return chart;   
  }

  // x axis title
  chart.xTitle = function(_) {
    if (arguments.length == 0) return xTitle;
    xTitle = _;
    return chart;       
  }

  // y axis title
  chart.yTitle = function(_) {
    if (arguments.length == 0) return yTitle;
    yTitle = _;
    return chart;       
  }

  // yItems (can be dynamically added after chart construction)
  chart.yDomain = function(_) {
    if (arguments.length == 0) return yDomain;
    yDomain = _;
    if (svg) {
      // update the y ordinal scale
      y = d3.scale.ordinal().domain(yDomain).rangeRoundPoints([height, 0], 1);
      // update the y axis
      yAxis.scale(y)(yAxisG);
    }
    return chart;       
  }
  // version
  chart.version = version;
  return chart;
} // end realTimeChart function