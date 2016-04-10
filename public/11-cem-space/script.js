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
    plot2 = d3.select('#plot-2').append('svg')
        .attr('width', w + m.l + m.r)
        .attr('height', h + m.b + m.t)
        .append('g').attr('class','graph')
        .attr('transform','translate('+m.l+','+m.t+')');
    plot3 = d3.select('#plot-3').append('svg')
        .attr('width', w + m.l + m.r)
        .attr('height', h + m.b + m.t)
        .append('g').attr('class','graph')
        .attr('transform','translate('+m.l+','+m.t+')');



d3.tsv('../00_data/cem/space/cem-room-inventory-working.tsv',parse, dataLoaded);

function dataLoaded(err, rows){
    //basic data discovery
    //how much area in total
    console.log("Total area in m2:")
    console.log(d3.sum(rows,function(d){return d.area}));

    //space breakdown by FICM code
    var spaceByType = d3.nest().key(function(d){return d.superFicm}).rollup(function(leaves){return d3.sum(leaves,function(l){return l.area})})
        .map(rows,d3.map);


    //plot 1: break down by super FICM
    var pie = d3.layout.pie()
        .value(function(d){return d.value})
        .padAngle(Math.PI/270)
        .sort(function(a,b){return a.key - b.key}); //sort by super FICM
    var arc = d3.svg.arc()
        .innerRadius(20)
        .outerRadius(h/4-100);

    var spaceTypes = plot.append('g')
        .attr('class','space-by-type')
        .attr('transform','translate('+w/2+','+h/2+')')
        .selectAll('.super-ficm')
        .data(pie(spaceByType.entries()),function(d){return d.data.key})
        .enter()
        .append('g').attr('class','super-ficm');

    spaceTypes.append('path')
        .attr('d',arc)
        .attr('fill',function(d){return config.colorByFicm(d.data.key); });
    spaceTypes.append('text')
        .text(function(d){return d.data.key + ' ' + Math.round(d.data.value)})
        .style('fill',function(d){return config.colorByFicm(d.data.key); })
        .attr('transform',function(d){
            var angle = (d.startAngle+ d.endAngle)*90/Math.PI-90;
            return 'rotate('+angle+')translate('+(h/4-50)+')';
        });

    //plot 2: detailed breakdown by FICM
    var spaceByFicm = {
        key:'cem',
        values: d3.nest()
            .key(function(d){return d.superFicm})
            .key(function(d){return d.ficm})
            .entries(rows)
        };

    var partition = d3.layout.partition()
        .value(function(d){return d.area})
        .children(function(d){return d.values})
        .sort(function(a,b){return a.key - b.key});
    var arc2 = d3.svg.arc()
        .startAngle(function(d){return d.a1})
        .endAngle(function(d){return d.a2})
        .innerRadius(function(d){return d.r1})
        .outerRadius(function(d){return d.r2});


    console.log(partition(spaceByFicm))

    var spaceTypesByFicm = plot2.append('g')
        .attr('class','space-by-type')
        .attr('transform','translate('+w/2+','+h/2+')')
        .selectAll('.ficm')
        .data(partition(spaceByFicm).filter(function(d){return d.depth<3 && d.depth>0}))
        .enter()
        .append('g').attr('class','ficm')
        .each(function(d){
            d.a1 = d.x*Math.PI*2;
            d.a2 = (d.x+ d.dx)*Math.PI*2;
            d.r1 = d.depth==1?20:h/4-95;
            d.r2 = d.depth==1?h/4-100:h/4-40;
        })

    spaceTypesByFicm
        .append('path')
        .attr('d',arc2)
        .style('fill',function(d){
            return config.colorByFicm(Math.floor(d.key/100)*100);
        });
    spaceTypesByFicm.append('text')
        .text(function(d){return d.key + ' ' + Math.round(d.value)})
        .style('fill',function(d){return config.colorByFicm(Math.floor(d.key/100)*100); })
        .attr('transform',function(d){
            var angle = ((d.a1+ d.a2)*90/Math.PI-90),
                translate = d.depth==1?(h/4+50):(h/4-30);
            return 'rotate('+angle+')translate('+translate+')rotate(180)';
        });

    //plot3 treemap
    var treemap = d3.layout.treemap()
        .children(function(d){return d.values})
        .value(function(d){return d.area})
        .size([w,h/2])
        .padding(function(d){
            if(d.depth == 1){return 10};
            return 0;
        });

    var spaceByBldg = {
        key:'cem',
        values:d3.nest()
            .key(function(d){return d.bldg})
            .key(function(d){return d.superFicm})
            .entries(rows)
    };

    var spaceByBldgGroups = plot3.selectAll('.room')
        .data(treemap(spaceByBldg).filter(function(d){return d.depth==3 || d.depth==1;}))
        .enter()
        .append('g').attr('class','room')
        .attr('transform',function(d){
            return 'translate('+ d.x+','+ d.y+')';
        })
    spaceByBldgGroups
        .append('rect')
        .attr('width',function(d){return d.dx})
        .attr('height',function(d){return d.dy})
        .style('fill',function(d){
            if(d.depth==1) return 'none';
            return config.colorByFicm(d.superFicm)
        })
        .style('stroke-width','.5px')
        .style('stroke','white')
    spaceByBldgGroups.filter(function(d){return d.depth==1})
        .append('text')
        .text(function(d){return d.key});







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