console.log("CEM instructional space usage");
console.log(d3);

var m = {t:100,r:50,b:100,l:50},
	w = d3.select('.plot').node().clientWidth - m.l - m.r,
	h = d3.select('.plot').node().clientHeight - m.t - m.b,
	x0 = 0,
	x1 = 30,
	x2 = 50,
	w1 = w - x2,
	dayPadding = 40,
	bldgPadding = 5,
	days = 6, //show Mon to Sat
	t0 = 7, t1 = 22; //show 7AM to 10PM

var svg = d3.select('.plot').append('svg')
	.attr({
		width:w+m.l+m.r,
		height:h+m.t+m.b
	})
	.append('g')
	.attr('transform','translate('+m.l+','+m.t+')');

var scale = {};
scale.occupancy = d3.scale.linear().domain([0,.7,1]).range(['blue','white','red']);

//map for room data lookup based on room id
var roomMap = d3.map(),
    divCode = d3.map();

//timeticks
var timeTicks = d3.range(6).map(function(d,i){
	return [
		{day:d,time:t0},
		{day:d,time:12},
		{day:d,time:18},
		{day:d,time:t1}
		]
	});

//draw day and time legend at the top
var legend = svg.append('g').attr('class','legend').attr('transform','translate('+x2+',-30)')
	.selectAll('.legend-group')
	.data(timeTicks)
	.enter()
	.append('g').attr('class','legend-group');
legend.append('line').attr('y1',15).attr('y2',15).attr('x1',function(d){return timeScale(d[0])}).attr('x2',function(d){return timeScale(d[3])})
	.style('stroke-width',2).style('stroke','rgb(80,80,80)');
var ticks = legend.selectAll('.tick')
	.data(function(d){return d})
	.enter()
	.append('g').attr('class','tick').attr('transform',function(t){ return 'translate('+timeScale(t)+','+'0)'});
ticks.append('line').attr('y1',13).attr('y2',15).style('stroke-width',1).style('stroke','rgb(80,80,80)');
ticks.append('text').text(function(t){return t.time}).attr('text-anchor','middle');


//Import data
d3_queue.queue()
	.defer(d3.csv,'../00_data/cem/instructional-space-only/Classrooms CCM,CEM,GDA,MTY,QRO,CSF -AD14.csv',parse)
	.defer(d3.tsv,'../00_data/cem/schedule/CourseSchedule_DSE Schedule 201513.tsv',parseCourse)
    .defer(d3.csv,'../00_data/cem/metadata-divisions.csv',parseDivMetadata)
    .await(dataLoaded);


function dataLoaded(err, rooms, coursesData){
	var roomsData = {
			key:'GDA',
			values:d3.nest()
				.key(function(d){return d.bldg})
				.entries(rooms)
		}
	computeMetrics(roomsData); //computes roomCount, capacity for each node; modify in place


	//Draw blocks to represent rooms
	var blocks = svg.selectAll('.block')
		.data(layout(roomsData))
		.enter()
		.append('g')
		.attr('class','block')

	var bldgs = blocks.filter(function(d){return d.depth == 1}).attr('transform', function(d){ return 'translate(0,'+ d.y +')'})
	bldgs.append('rect').attr('width',5).attr('height',function(d){return d.h});
	bldgs.append('text').text(function(d){return d.key}).attr('text-anchor','end').attr('y',function(d){return d.h/2});

	var rooms = blocks
		.filter(function(d){return d.depth ==2;})
		.attr('transform', function(d){ return 'translate(0,'+ d.y +')'});
	rooms
		.append('rect')
		.attr('width',20).attr('height',function(d){return d.h})
		.style('fill', function(d,i){
			return i%2==0?'rgb(210,210,210)':'rgb(170,170,170)';
		});
	rooms
		.append('g').attr('transform','translate('+x2+','+'0)')
		.each(function(r,i){

			d3.select(this).selectAll('.meeting')
				.data(timeTicks)
				.enter()
				.append('rect')
				.attr('x',function(m){ return timeScale(m[0]); })
				.attr('width',function(m){ return timeScale(m[3]) - timeScale(m[0]); })
				.attr('height',r.h)
				.attr('fill',i%2==0?'rgb(245,245,245)':'rgb(250,250,250)');
		})



	
	//Draw courses; only courses that has correct room assignments
    //data discovery of courses
    console.log(coursesData);
    console.log(d3.nest().key(function(d){return d.div}).map(coursesData,d3.map).keys())
    console.log(coursesData.filter(function(c){return !c.enrollment || !c.room}));


    var courses = svg.selectAll('.course')
		.data(coursesData)
		.enter()
		.append('g').attr('class','course')
		.attr('transform',function(d){
			var room = roomMap.get(d.room);
			if(room == undefined){
				console.error('Room corresponding to course '+d.CRN + ' cannot be found');
				return;
			}

			return 'translate('+ x2 +',' + room.y +')'
		})
		.filter(function(d){
			return roomMap.get(d.room);
		})
		.each(function(c){
			var room = roomMap.get(c.room);

			d3.select(this).selectAll('.meeting')
				.data(c.meetings)
				.enter()
				.append('rect').attr('class','meeting')
				.attr('x',function(m){ return timeScale(m[0]); })
				.attr('width',function(m){ return timeScale(m[1]) - timeScale(m[0]); })
				.attr('height',room.h)
                .style('fill', config.colorByDivision( divCode.get(c.div) ))
                //.style('fill', scale.occupancy(c.enrollment/ room.capacity))
                .on('click',function(){ console.log(c) });

		})

}


function parse(d){
	if(d.Campus != "EDM") return; //instructional space dataset identifies CEM as EDM instead

	return {
		campus:d.Campus,
		bldg:d['Salon'].split('-')[1],
		room:d['Salon'],
		capacity:+d['Capacidad Salon'],
		type:d['Tipo de Salon'],
		area:+d.AREA
	}
}

function parseCourse(d){
	//if(!d.HoraInicio || !d['Days of the week']) return; //probably ghost courses

	var course = {};

	course.div = d['Division'];
	course.dept = d.DEPARTAMENTO;
	course.CRN = d.CRN;
    course.name = d['NOMBRE DE LA MATERIA'];
	course.room = d['Room ID'];
	course.enrollment = +d['Enrollment'];
	course.meetings = [];
    course.startTime = d['HORA INICIO DE CLASE'].split(':');
    course.endTime = d['HORA FIN DE CLASE'].split(':');
    course.days = d['DAYS'].split('');
    //course.roomSize = +d['CAPACIDAD MçXIMA'];

	var t0 = (+course.startTime[0]) + (+course.startTime[1]/60),
		t1 = (+course.endTime[0]) + (+course.endTime[1]/60);
	if(course.days.indexOf('M')>-1) course.meetings.push([{day:0,time:t0},{day:0,time:t1}]);
	if(course.days.indexOf('T')>-1) course.meetings.push([{day:1,time:t0},{day:1,time:t1}]);
	if(course.days.indexOf('W')>-1) course.meetings.push([{day:2,time:t0},{day:2,time:t1}]);
	if(course.days.indexOf('R')>-1) course.meetings.push([{day:3,time:t0},{day:3,time:t1}]);
	if(course.days.indexOf('F')>-1) course.meetings.push([{day:4,time:t0},{day:4,time:t1}]);
	if(course.days.indexOf('S')>-1) course.meetings.push([{day:5,time:t0},{day:5,time:t1}]);

	return course;
}

function parseDivMetadata(d){
    divCode.set(d.division, d.code);
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

function layout(root){
	var nodes = [];

	root.y = 0;
	root.x = 0;
	root.h = h;
	root.depth = 0;

	nodes.push(root);

	var yPos = 0,
		scaleY = d3.scale.linear().domain([0, root.capacity]).range([0,h-bldgPadding*(root.values.length-1)]);

	//Buildings
	root.values.forEach(function(bldg){
		bldg.y = yPos;
		bldg.x = 0;
		bldg.h = scaleY(bldg.capacity);
		bldg.depth = 1;
		nodes.push(bldg);

		//Rooms
		var _yPos = bldg.y;
		bldg.values.forEach(function(room){
			room.y = _yPos;
			room.x = 0;
			room.h = scaleY(room.capacity);
			room.depth = 2;
			nodes.push(room);

			roomMap.set(room.room, room);

			_yPos += room.h;
		})

		yPos += bldg.h + bldgPadding;
	})

	return nodes;
}

function timeScale(x){
	var dayRange = (w - x2 - dayPadding*(days-1))/days; 
	var scaleX = d3.scale.linear().domain([t0,t1]).range([0,dayRange]); //9am to 6pm --> maps to 0 to dayRange;

	return (x.day*(dayRange + dayPadding) + scaleX(x.time));
}