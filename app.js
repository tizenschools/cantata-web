#!/usr/bin/env node

// Module dependencies.
var express = require( 'express' ) // Web framework
, connect = require( 'connect' )	// Server
, routes = require( './routes/handle' )	// Our implement
, user = require( './routes/user' )	// Dummy
, http = require( 'http' )			// Web Server
, io = require( 'socket.io' )		// Socket.io
, path = require( 'path' );			// Path 

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
});

// Register url mapping
app.get( '/users', user.list );


// 시스템
app.get( '/system/storage', routes.system.storage );

// 주소록
app.get( '/contacts', routes.contacts );

app.post( '/categories', routes.categories.add );

// 문자
app.get( '/messages', routes.sessions );
app.get( '/messages/:mid', routes.messages );
app.post( '/messages', routes.messages.send );

// 음악
app.get( '/musics', routes.musics );
app.get( /^\/musics(\/.*)/, routes.musics.download );
app.post( '/musics', routes.musics.upload ); // music upload
app.delete( /^\/musics(\/.*)/, routes.musics.remove );

app.get( '/playlists', routes.playlists );
app.get( '/playlists/:name', routes.playlists.get );

// 사진
app.get( '/photos', routes.photos );
app.get( /^\/photos(\/.*)/, routes.photos );
app.post( '/photos', routes.new );
app.post( /^\/photos(\/.*)/, routes.photos.new );
app.delete( /^\/photos(\/.*)/, routes.photos.remove );
app.put( /^\/photos(\/.+)/, routes.files.move );// 파일 이름 바꾸기

// 파일
app.get( '/files', routes.files );// 디렉토리 조회
app.get( /^\/files(\/.+)/, routes.files );// 디렉토리 조회 및 파일 다운로드
app.post( '/files', routes.files.new );// 디렉토리 생성 및 업로드
app.post( /^\/files(\/.+)/, routes.files.new );// 디렉토리 생성 및 업로드
app.delete( /^\/files(\/.+)/, routes.files.remove );// 파일 및 디렉토리 삭제
app.put( /^\/files(\/.+)/, routes.files.move );// 파일 이름 바꾸기

// Start server
io = io.listen( http
.createServer( app )
.listen( app.get('port'), function() {
	console.log( "Express server listening on port " + app.get( 'port' ) );
} ) );

// Start socket.io
io.sockets.on( 'connection', function( socket ) {
	socket.on( 'message', function( data ) {
		socket.broadcast.send( data );
	} );

	socket.on( 'disconnect', function() {
	} );
} );

context = {
	io: io
};
