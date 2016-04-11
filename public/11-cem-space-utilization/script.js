console.log("Space utilization");
console.log(d3);

var selectedDay = "Monday";
$("#select-day").on('change', function() {
    selectedDay = $(this).val();
    console.log(selectedDay);
    removeChart();
    drawChart();
    $("#chart-header").html(selectedDay);
    $("title").html("Classroom Utilization " +  selectedDay);
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

function drawChart() {
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

function removeChart() {
    d3.selectAll("path").remove();
    d3.selectAll("text").remove();
    d3.selectAll(".bar").remove();
};

function type(d) {
    d.Util_Rate = +d.Util_Rate;
    return d;
}

drawChart();
