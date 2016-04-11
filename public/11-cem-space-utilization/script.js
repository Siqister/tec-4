console.log("Space utilization");

var selectedView = "Day";
var selectedDay = "Monday";

$("#chart-header").html("Week View");
$("#select-view").on('change', function() {
    selectedView = $(this).val();
    $("#chart-header").html(selectedView);
    $("title").html(selectedView + "Classroom Utilization");
    if (selectedView == "Day") {
        $("#select-day").prop("disabled",false);
        $("#chart-header").html(selectedDay);
        removeChart();
        drawBarChart();
    }
    else {
        $("#select-day").prop("disabled",true);
        $("#chart-header").html("Week View");
        removeChart();
        drawLineChart();
    }
});

$("#select-day").on('change', function() {
    selectedDay = $(this).val();
    console.log(selectedDay);
    removeChart();
    drawBarChart();
    $("#chart-header").html(selectedDay);
    $("title").html(selectedDay + "Classroom Utilization");

});

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .range([height, 0]);

var svg = d3.select("#plot-1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function drawBarChart() {
    d3.csv('../00_data/cem/space-utilization/CourseScheduleFlat.csv', function (data) {

        data = data.filter(function (d) {
            return d.Day == selectedDay
        });
        console.log(data);


        x.domain(data.map(function (d) {
            return d.Hour
        }));
        y.domain([0, 1]);

        var ticks = x.domain().filter(function (d, i) {
            return !(i % 12);
        });

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickValues(ticks)
            .tickSize(0);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10, "%")
            .tickSize(0);


        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            // .text("Usage Rate");
;
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) {
                return x(d.Hour);
            })
            .attr("width", x.rangeBand())
            .attr("y", function (d) {
                return y(d.Util_Rate);
            })
            .attr("height", function (d) {
                return (height - 1) - y(d.Util_Rate);
            });
    });

};

function type(d) {
    d.Util_Rate = +d.Util_Rate;
    return d;
}

function drawLineChart() {

    var colors = d3.scale.ordinal()
        .domain(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
        .range(["#EF4E28", "#FFDD17" , "#70C6A9", "#2AB573", "#B41E87", "#009EDA", "#FFF"]);


    d3.csv('../00_data/cem/space-utilization/CourseScheduleFlat.csv', function (data) {
        x.domain(data.map(function (d) {
            return d.Hour
        }));
        y.domain([0, 1]);

        var ticks = x.domain().filter(function (d, i) {
            return !(i % 12);
        });

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickValues(ticks)
            .tickSize(0);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10, "%")
            .tickSize(0);


        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
        // .text("Usage Rate");
        ;

// This is the same data as you have created

// Create a line object which will set the 'd' attributes for the paths
        var nestedData = d3.nest().key(function (d) {
            return d.Day;
        }).entries(data);


        var line = d3.svg.line()
            .interpolate("linear")
            .x(function (d) {
                return x(d.Hour);
            })
            .y(function (d) {
                if (d.Util_Rate > 1) {
                    return y(d.Util_Rate);
                }
                else {
                    return y(d.Util_Rate) - 3;
                }
            });

// The chart container
        var gLines = svg.selectAll('g.chart-area').data([nestedData]);

        gLines.enter()
            .append('g')
            .classed('chart-area', true)
        // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ")");
        ;
// Our 'paths' which are the lines
        var lines = gLines.selectAll('path.supplier').data(function (d) {
            return d;
        });
// Our 'paths' which are the lines
        lines.enter()
            .append('path')
            .classed('lines', true)
            .attr('d', function (d) {
                return line(d.values);
            })
            .attr('fill', 'none')
            .attr('stroke', function (d, i) {
                return colors(i);
            });
    });

    function createLegend() {
        console.log(colors.domain());
        var legendRectSize = 18;
        var legendSpacing = 4;
        var legendContainer = svg.append('g')
            .attr("class","legendContainer")
            .attr("transform", "translate(" + (width - margin.left) + ",0)");

        var legend = svg.selectAll('.legend')
            .data(colors.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) {
                var height = legendRectSize + legendSpacing;
                var offset =  height * colors.domain().length / 2;
                var horz = -2 * legendRectSize + width - 70;
                var vert = i * height - offset + 70;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', colors)
            .style('stroke', colors);

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) { return d; });
    }
createLegend();
}

drawLineChart();

function removeChart() {
    d3.selectAll(".legend").remove();
    d3.select(".legendContainer").remove();
    d3.selectAll("rect").remove();
    d3.selectAll("path").remove();
    d3.selectAll("text").remove();
    d3.selectAll(".bar").remove();
};

