console.log("CEM students and course registration");
console.log(d3);

var m = {t:20,r:50,b:20,l:50},
    w = d3.select('#plot-1').node().clientWidth - m.l - m.r,
    h = d3.select('#plot-1').node().clientHeight - m.t - m.b,
    plot = d3.select('#plot-1').append('svg')
        .attr('width', w + m.l + m.r)
        .attr('height', h + m.b + m.t)
        .append('g').attr('class','graph')
        .attr('transform','translate('+m.l+','+m.t+')');

var divisionMap = d3.map();


d3.tsv('../00_data/cem/students/course-enrollment-201611.tsv',parse, dataLoaded);

function dataLoaded(err, rows){
    //basic data discovery
    //how many unique students, departments, courses?

    var students = d3.nest()
        .key(function(d){return d.stdntId})
        .map(rows,d3.map)

    var classes = d3.nest()
        .key(function(d){return d.classId})
        .map(rows,d3.map)

    var depts = d3.nest()
        .key(function(d){return d.classDept})
        .map(rows,d3.map)

    var divisions = d3.nest()
        .key(function(d){return d.classDivision})
        .map(rows,d3.map)

    console.log(students);
    console.log(classes);
    console.log(depts);
    console.log(divisions);


    //create a circular cluster diagram
    //div -> dept -> courses
    var courses = d3.nest().key(function(d){return d.classId}).entries(rows)
        .map(function(d){
            var course = {};
            course.classDivision = d.values[0].classDivision;
            course.classDeptId = d.values[0].classDeptId;
            course.classId = d.key;
            course.enrolled = d.values;
            return course;
        });
    var root = {
            key:'cem',
            values:d3.nest().key(function(d){return d.classDivision}).key(function(d){return d.classDeptId}).entries(courses)
        };
    console.log(root);

    //create layout, scales and generators
    var cluster = d3.layout.cluster()
        .size([270,h/2-150])
        .value(function(d){return 1})
        .children(function(d){return d.values});

    var scaleEnrollment = d3.scale.linear().domain([0,50]).range([2,30]),
        scaleColor = d3.scale.ordinal().domain(divisions.keys()).range(['#F05A28','#03afeb','#00B273','#B41E87','#213F99','#46BFB0']);

    var path = d3.svg.diagonal.radial()
        .projection(function(d){
            //[r, a]
            return [d.y, d.x/360*2*Math.PI]
        })

    //lay out data
    var nodes = cluster(root),
        links = cluster.links(nodes);

    console.log(nodes); console.log(links)

    //vision representation
    var graph = plot.append('g').attr('transform','translate('+w/2+','+h/2+')');

    var node = graph.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g').attr('class','node')
        .attr('transform',function(d){
            return 'rotate('+(d.x-90)+')translate('+d.y+',0)';
        });
    //divisions and departments
    node
        .filter(function(d){return d.depth<3})
        .append('circle').attr('class','node').attr('r',5)
        .style('stroke',function(d){
            if(divisionMap.get(d.key)){return scaleColor( divisionMap.get(d.key) )};
        })
    node
        .filter(function(d){return d.depth<3})
        .append('text').attr('text-anchor','end')
        .text(function(d){return d.key})
        .style('fill',function(d){
            if(divisionMap.get(d.key)){return scaleColor( divisionMap.get(d.key) )};
        })
    //courses -> leaf nodes
    node
        .filter(function(d){return d.depth==3})
        .append('line').attr('x2',function(d){return scaleEnrollment(d.enrolled.length)})
        .style('stroke',function(d){
            console.log(d);
            if(divisionMap.get(d.classId)){return scaleColor( divisionMap.get(d.classId) )};
        })
    //links
    var link = graph.selectAll('.link')
        .data(links)
        .enter()
        .insert('path','.node').attr('class','link')
        .attr('d',path)
        .style('stroke',function(d){
            if(divisionMap.get(d.source.key)){return scaleColor( divisionMap.get(d.source.key) )};
        })


}

function parse(d){
    if( !divisionMap.get(d['CLAVE']) ){ divisionMap.set(d['CLAVE'],d['DIVISI?N']) }
    if( !divisionMap.get(d['DEPT']) ){ divisionMap.set(d['DEPT'],d['DIVISI?N'])}
    if( !divisionMap.get(d['DIVISI?N']) ){ divisionMap.set(d['DIVISI?N'],d['DIVISI?N']) }

    return {
        campus:d['CAMPUS DE INSCRIPCI?N'],
        status:d['REGISTRO MATERIA (RSTS)'],
        stdntId:d['MATR?CULA'],
        stdntLevel:d['NIVEL'],
        stdntMajor:d['MAJR'],
        classFormat:d['FORMATO CLASE'],
        classDivision:d['DIVISI?N'],
        classDept:d['DEPARTAMENTO'],
        classDeptId:d['DEPT'],
        classId:d['CLAVE'],
        className:d['NOMBRE DE LA MATERIA'],
        crn:+d['CRN']
    }
}