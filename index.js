var express = require('express'),
	app = express();

app.use('/',express.static(__dirname+'/public'));
app.use('/bootstrap',express.static(__dirname+'/node_modules/bootstrap'));
app.use('/d3',express.static(__dirname+'/node_modules/d3'));

app.listen(3000);
console.log('App listening on port 3000');