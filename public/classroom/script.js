console.log("Classroom size and capacity");
console.log(d3);

var m = {t:100,r:50,b:100,l:50},
	w = d3.select('.plot').node().clientWidth - m.l - m.r,
	h = d3.select('.plot').node().clientHeight - m.t - m.b,
	x0 = 0,
	x1 = 100,
	x2 = 120,
	w1 = w - x2,
	dayPadding = 20;

var svg = d3.select('.plot').append('svg')
	.attr({
		width:w+m.l+m.r,
		height:h+m.t+m.b
	})
	.append('g')
	.attr('transform','translate('+m.l+','+m.t+')');

var scale = {};
scale.type = d3.scale.ordinal().domain(['Sal¢n Tradicional','Sal¢n VERB','Sal¢n NODE','Otro']).range(['#F05A28','#90D3CF','#F6EB13','#D8D8D8']);

d3.csv('../00_data/classrooms/classrooms-ad14.csv',parse,loaded);

function loaded(err, rows){
	var data = {
		key:"CDM",
		values:d3.nest()
			.key(function(d){return d.bldg})
			//.key(function(d){return d.type})
			.entries(rows)
	}

	//tabulate room count and total capacity
	computeMetrics(data);


	var layout = d3.layout.partition()
		.children(function(d){return d.values})
		.value(function(d){return d.roomCount})
		.size([h,x1-x0])
		.sort(null)

	var blocks = svg.selectAll('.block')
		.data(layout(data))
		.enter()
		.append('g')
		.attr('class','block')
		.attr('transform',function(d){return 'translate('+d.y+','+d.x+')'});

	blocks
		.filter(function(d){return d.depth>0})
		.append('rect')
		.attr('width',function(d){return d.dy-3})
		.attr('height',function(d){return d.dx})
		.style('stroke-width',function(d){
			if(d.children) return '1px';
			return '0px';
		})
		.style('stroke','rgb(252,252,252)')
		.style('fill',function(d){
			if(!d.type) return 'rgb(240,240,240)';
			return scale.type(d.type);
		})

	var buildings = blocks.filter(function(d){
			return d.depth == 1;
		})
		.append('text')
		.text(function(d){return d.key})
		.attr('y',function(d){return d.dx/2})
		.attr('text-anchor','end')

	var rooms = blocks.filter(function(d){
			return !d.children;
		}).each(function(d){


			d3.select(this)
				.append('g').attr('class','time')
				.attr('transform', function(d){
					return 'translate('+(x2-d.y)+',0)';
				})
				.selectAll('.time-block')
				.data(d3.range(5*9))
				.enter()
				.append('rect')
				.attr('x',function(_d,i){
					return (w1-dayPadding*4)/45*i+(Math.floor(i/9))*dayPadding;
				})
				.attr('width',(w1-dayPadding*4)/45-2)
				.attr('height',d.dx-1)
				.style('fill','rgb(245,245,245)');

		})
		.on('mouseenter',function(){
			blocks.selectAll('rect').style('fill-opacity',.4);
			d3.select(this).selectAll('rect').style('fill-opacity',1);
		})
		.on('mouseleave',function(){
			blocks.selectAll('rect').style('fill-opacity',1);
		})
}

function parse(d){
	if(d.Campus != "CDM") return;

	return {
		campus:d.Campus,
		bldg:d.Building,
		room:d['Salon'],
		capacity:+d['Capacidad Salon'],
		type:d['Tipo de Salon'],
		area:+d.AREA
	}
}

function computeMetrics(root){

	if(!root.values){
		root.roomCount = 1;
		return {
			roomCount: 1,
			capacity: root.capacity
		}
	}else{
		root.roomCount = 0; root.capacity = 0;
		root.values.forEach(function(v){
			var _ = computeMetrics(v);
			root.roomCount += _.roomCount;
			root.capacity += _.capacity;
		});
		root.avgCap = root.capacity/root.roomCount;
		return {
			roomCount: root.roomCount,
			capacity: root.capacity
		}
	}

}