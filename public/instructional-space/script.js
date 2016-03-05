console.log("Classroom size and capacity");
console.log(d3);

var m = {t:100,r:50,b:100,l:50},
	w = d3.select('.plot').node().clientWidth - m.l - m.r,
	h = 2400,
    h0 = 400,
	x0 = 0,
	x1 = 30,
	x2 = 50,
	w1 = w - x2,
	dayPadding = 40,
	bldgPadding = 5,
	days = 6,
	t0 = 7, t1 = 22;

var svg = d3.select('.plot').append('svg')
	.attr({
		width:w+m.l+m.r,
		height:h+m.t+m.b
	})
	.append('g')
	.attr('transform','translate('+m.l+','+m.t+')');

var scale = {};
scale.type = d3.scale.ordinal().domain(['Sal¢n Tradicional','Sal¢n VERB','Sal¢n NODE','Otro']).range(['#F05A28','#90D3CF','#C1F5FF','#D8D8D8']);
scale.occupancy = d3.scale.linear().domain([0,.5,1]).range(['blue','purple','red']);
scale.schools = d3.scale.category20();
scale.roomSize = d3.scale.threshold().domain([15,50,100]).range(['#f05a28','#d4eef6','#3398cc','#2ab573'])

//map for room data lookup based on room id
var roomMap = d3.map();


//Import data
d3_queue.queue()
	.defer(d3.csv,'../00_data/classrooms/Classrooms CCM,CEM,GDA,MTY,QRO,CSF -AD14.csv',parse)
	.defer(d3.csv,'../00_data/course-enrollment/GDA-Courses information Ago-Dic-2015_schedule.csv',parseCourse)
	.await(dataLoaded);



function dataLoaded(err, rooms, coursesData){

    var treemap = d3.layout.treemap()
        .children(function(d){return d.values})
        .value(function(d){return d.capacity})
        .padding(5);

    var bldgByCampus = d3.nest()
        .key(function(d){return d.campus})
        .key(function(d){return d.bldg})
        .entries(rooms);

    console.log(bldgByCampus);

    var campuses = svg.selectAll('.campus')
        .data(bldgByCampus)
        .enter()
        .append('g').attr('transform',function(d,i){
            return 'translate(0,'+i*h0+')';
        });

    campuses.each(function(d){
        var totalCap = 0;
        d.values.forEach(function(bldg){
            totalCap += d3.sum(bldg.values,function(d){return d.capacity});
        })
        console.log(totalCap);

        treemap.size([totalCap/22000*w,h0-50]);

        var nodes = d3.select(this).selectAll('.node')
            .data(treemap(d))
            .enter()
            .append('rect')
            .attr('class',function(_d){return 'depth-'+_d.depth})
            .attr('x',function(_d){return _d.x})
            .attr('y',function(_d){return _d.y})
            .attr('width',function(_d){return _d.dx})
            .attr('height',function(_d){return _d.dy})
            .style('fill',function(_d){
                if(_d.capacity) return scale.roomSize(_d.capacity);
                return 'none';
            })
            .style('stroke','white')
            .style('stroke-width','1px')

        nodes.filter(function(_d){return _d.depth<2})
            .style('fill','none');

        var text = d3.select(this).selectAll('text')
            .data(treemap(d))
            .enter()
            .append('text')
            .filter(function(_d){return _d.depth<2})
            .text(function(_d){return _d.key})
            .attr('x',function(_d){return _d.x})
            .attr('y',function(_d){return _d.y})

    })

}


function parse(d){
	var roomCode = d['Salon'].split('-'),
        room = roomCode.pop();

	return {
		campus:d.Campus,
		bldg:roomCode.join('-'),
		room:room,
		capacity:+d['Capacidad Salon'],
		type:d['Tipo de Salon'],
		area:+d.AREA
	}
}

function parseCourse(d){
	if(!d.HoraInicio || !d['Days of the week']) return; //probably ghost courses

	var course = {};

	course.school = d.Escuela;
	course.div = d.Division;
	course.dept = d.Departamento;
	course.CRN = d.CRN;
	course.room = d['Inventory Room_ID'];
	course.enrollment = +d.Alu_Inscritos;
	course.meetings = [];

	var t0 = Math.floor(+d.HoraInicio/100) + (+d.HoraInicio%100/60),
		t1 = Math.floor(+d.HoraFin/100) + (+d.HoraFin%100/60);
	if(d.Lunes) course.meetings.push([{day:0,time:t0},{day:0,time:t1}]);
	if(d.Martes) course.meetings.push([{day:1,time:t0},{day:1,time:t1}]);
	if(d.Miercoles) course.meetings.push([{day:2,time:t0},{day:2,time:t1}]);
	if(d.Jueves) course.meetings.push([{day:3,time:t0},{day:3,time:t1}]);
	if(d.Viernes) course.meetings.push([{day:4,time:t0},{day:4,time:t1}]);
	if(d.Sabado) course.meetings.push([{day:5,time:t0},{day:5,time:t1}]);

	return course;
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