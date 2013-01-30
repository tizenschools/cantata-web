#!/usr/bin/env node

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
		socket.broadcase.send( data );
	} );

	socket.on( 'disconnect', function() {
	} );
} );

context = {
	io: io
};
