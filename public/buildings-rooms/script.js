//var _ = require('underscore')
var width = 1000;
var height = 1000;

var svg = d3.select('svg')
            .attr('width', width).attr('height', height);

d3.json("../00_data/space-use/buildings-rooms.json", function(data) {


	var nested = d3.nest()
		.key(function(d){return "world";})
		.key(function(d){return d.Campus;})
		.key(function(d){return d.building;})
		.key(function(d){return d.room;})
		.entries(data);

	console.log(nested);

	//var data = _.nest(data, ['Campus', '1']);

	var nested2 = { "name": "World", "children":
		nested.map( function(Campus){
			return { "name": Campus.key, "children":
				Campus.values.map( function(building){
					return { "name": building.key, "children":
						building.values.map(function(room){
							return { "name": room.key, "children": room.values };

						}) //end of map(function(country){
					};

				}) //end of map(function(region){
			};

		}) //end of map(function(major){
	}; //end of var declaration

	var tree = d3.layout.tree().size([width, height])
		.nodes(nested);

	tree.children(function(d, depth) {return d.values;});

	console.log(tree);


});

