var _ = require( 'underscore' );
var path = require( 'fs' );

osp = null;
if ( path.existsSync( './tizen-native.node' ) ) {
	osp = require( './tizen-native.node' );
} else {
	osp = require( './tizen-native.js' );
}

/* 주소록 관련 기능 */
exports.contacts = function( req, res ) {
    console.log( JSON.stringify( osp.Contacts.list(), null, '\t' ) );     
	res.send( JSON.stringify( osp.Contacts.list() ) );     
};

exports.categories.add = function( req, res ) {
	console.log( 'Name: ' + req.body.name );
	var contacts = osp.Contacts.addCategory( req.body.name );
	context.io.sockets.emit( 'newCategory', [ req.body.name ] );
};


exports.categories.remove = function( req, res ) {
	console.log( 'Name: ' + req.body.name );
	var contacts = osp.Contacts.removeCategory( req.body.name );
	context.io.sockets.emit( 'removeCategory', [ req.body.name ] );
}

exports.contacts.add = function( req, res ) {
}

expors.contacts.remove = function( req, res ) {
}

exports.contacts.details = function( req, res ) {
}

/* 문자 관련 기능 */
exports.messages = function( req, res ) {
}

exports.messages.send = function( req, res ) {
}


/* 음악 관련 기능 */
exports.musics = function( req, res ) {
}
exports.musics.upload = function( req, res ) {
}
exports.musics.download = function( req, res ) {
}
exports.musics.remove = function( req, res ) {
}

/* 사진 관련 기능 */
exports.photos = function( req, res ) {
}
exports.photos.upload = function( req, res ) {
}
exports.photos.download = function( req, res ) {
}
exports.photos.remove = function( req, res ) {
}

/* 파일 관리 */
exports.files = function( req, res ) {
	console.log( 'Path: ' + req.body.path );
	res.send( JSON.stringify( exports.files.model[ req.body.path ] ) );
}
exports.files.new = function( req, res ) {
	if ( exports.files.model[ req.body.path ] ) {
	}

	exports.files.model[ req.body.name ] = req.body.file;
	context.io.sockets.emit( 'newDirectory', );
}
exports.files.remove = function( req, res ) {
}
exports.files.move = function( req, res ) {
}

exports.files.model =
{
	'/':
		[ {
			type: 'd',
			name: 'Directory'
		}, {
			type: 'f',
			name: 'File'
		} ],
	'/Directory':
		[ {
			type: 'f',
			name: 'Test1'
		}, {
			type: 'f',
			name: 'Test2'
		} ]
};


