/**
 * Created by siqi on 4/9/16.
 */
var config = {};

config.colors = d3.map(
    {
        'red':'#F05A28',
        'blue':'#03afeb',
        'green':'#00B273',
        'purple':'#B41E87',
        'navy':'#213F99',
        'celadon':'#46BFB0',
        'gray':'rgb(230,230,230)',
        'gray2':'rgb(150,150,150)',
        'yellow':'#ffdd00'
    }
);

config.colorByFicm = d3.scale.ordinal()
    .domain([0,100,200,300,400,500,600,700,800])
    .range([
        config.colors.get('gray'),
        config.colors.get('green'),
        config.colors.get('celadon'),
        config.colors.get('red'),
        config.colors.get('navy'),
        config.colors.get('blue'),
        config.colors.get('gray2'),
        config.colors.get('gray')
    ]);

config.colorByDivision = d3.scale.ordinal()
    .domain([
        'IA', //eng & arch
        'AE', //student life
        'SH', //soc and humanities
        'NG', //biz
        'PR', //prepa
        'UV', //virtual
        'NA', //none
        'GA'])
    .range([
        config.colors.get('green'),
        config.colors.get('gray2'),
        config.colors.get('navy'),
        config.colors.get('red'),
        config.colors.get('celadon'),
        config.colors.get('blue'),
        config.colors.get('gray'),
        config.colors.get('yellow')
    ]);