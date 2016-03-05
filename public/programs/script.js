console.log("Classroom size and capacity");
console.log(d3);

var m = {t:20,r:50,b:20,l:50};

/*var svg = d3.select('.plot').append('svg')
	.attr({
		width:w+m.l+m.r,
		height:h+m.t+m.b
	})
	.append('g')
	.attr('transform','translate('+m.l+','+m.t+')');*/

d3.csv('../00_data/course-enrollment/ALL-programs.csv',parse,function(err,rows){
    var campuses = d3.nest().key(function(d){
        return d.campus
    }).entries(rows);

    var totalBaseline = d3.sum(campuses[0].values, function(d){return d.enrollment});

    var plots = d3.select('.container').selectAll('.plot')
        .data(campuses)
        .enter()
        .append('div').attr('class','plot');

    var w = d3.select('.plot').node().clientWidth - m.l - m.r,
        h = d3.select('.plot').node().clientHeight - m.t - m.b;

    var svg = plots.append('svg').attr('width',w+ m.l+ m.r).attr('height',h+ m.t+ m.b)
        .each(function(d){
            var total = d3.sum(d.values, function(d){return d.enrollment});

            var parset = d3.parsets()
                .dimensions(['class','code','type'])
                .value(function(d){return d.enrollment})
                .width(total/totalBaseline*w)
                .height(h);

            d3.select(this).datum(d.values).call(parset);
        })

});

function parse(d){
    d.enrollment = +d.enrollment;
    return d;
}