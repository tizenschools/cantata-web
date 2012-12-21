
// Module dependencies.
var express = require( 'express' )
, routes = require( './routes/mock' )
, user = require( './routes/user' )
, http = require( 'http' )
, path = require( 'path' );

var app = express();

app.configure(function(){
	app.set( 'port', process.env.PORT || 3000 );
	app.use( express.favicon() );
	app.use( express.logger('dev') );
	app.use( express.bodyParser() );
	app.use( express.methodOverride() );
	app.use( app.router );
	app.use( express.static( path.join( __dirname, 'public' ) ) );
});

app.configure( 'development', function() {
	app.use( express.logger() );
	app.use( express.errorHandler() );
	// Insert mockup
	routes = require( './routes/mock' )
});

app.configure( 'product', function() {
	app.use( express.errorHandler() );
	// Insert mockup
	routes = require( './routes' )
});

// Register url mapping
app.get( '/', routes.index );
app.get( '/users', user.list );
app.get( '/contacts', routes.contacts );
app.post( '/categories', routes.category.add );

// Start server
http
.createServer( app )
.listen( app.get('port'), function() {
	console.log( "Express server listening on port " + app.get( 'port' ) );
} );
