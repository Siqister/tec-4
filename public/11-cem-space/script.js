console.log("Space benchmark");
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


d3.tsv('../00_data/cem/space/cem-room-inventory.tsv',parse, dataLoaded);

function dataLoaded(err, rows){
    //basic data discovery
    //how much area in total
    console.log("Total area in m2:")
    console.log(d3.sum(rows,function(d){return d.area}));

    //space breakdown by FICM code
    var spaceByType = d3.nest().key(function(d){return d.superFicm}).rollup(function(leaves){return d3.sum(leaves,function(l){return l.area})})
        .map(rows,d3.map);
    console.log(spaceByType);
}

function parse(d){

    return {
        id:d['NOMENCLATURA DEL ESPACIO'],
        bldg:d['EDIFICIO'],
        dept:d['DIRECCION DE DEPARTAMENTO / DIRECCION DE CARRERA / CENTRO'],
        division:d['ESCUELA / DIRECCI�N GENERAL DE APOYO'],
        ficm:+d['FICM'],
        superFicm:+d['Super FICM'],
        use:d['USO DEL ESPACIO'],
        userName:d['NOMBRE'],
        userId:d['N�MINA'],
        area:+d['�REA M2']?+d['�REA M2']:0
        //capacity?
    }
}