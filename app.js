
// Module dependencies.
var express = require( 'express' )
, connect = require( 'connect' )
, routes = require( './routes/mock' )
, user = require( './routes/user' )
, http = require( 'http' )
, io = require( 'socket.io' )
, path = require( 'path' );

var app = express();

app.configure(function(){
	app.set( 'port', process.env.PORT || 3000 );
	app.use( connect.compress() );
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
app.get( '/users', user.list );


// 주소록
app.get( '/contacts', routes.contacts );

app.post( '/categories', routes.category.add );

// 문자
app.get( '/messages', routes.messages );
app.post( '/messages', routes.messages.send );

// 음악
app.get( '/musics', routes.musics );
app.post( '/musics', routes.musics.upload );
app.get( '/musics/:id', routes.musics.download );
app.delete( '/musics/:id', routes.musics.remove );

// 사진
app.get( '/musics', routes.musics );
app.post( '/musics', routes.musics.upload );
app.get( '/musics/:id', routes.musics.download );
app.delete( '/musics/:id', routes.musics.remove );


// 파일
app.get( '/files/:path', routes.files );
app.post( '/files/:path', routes.files.new );
app.delete( '/files/:id', routes.files.remove );
app.put( '/files/:id', routes.files.move );

// Start server
io = io.listen( http
.createServer( app )
.listen( app.get('port'), function() {
	console.log( "Express server listening on port " + app.get( 'port' ) );
} ) );

// Start socket.io
io.sockets.on( 'connection', function( socket ) {
	socket.on( 'message', function( data ) {
		socket.broadcase.send( data );
	} );

	socket.on( 'disconnect', function() {
	} );
} );

context = {
	io: io
};
