var _ = require( 'underscore' );
var fs = require( 'fs' );

stringify = function( object ) {
	return JSON.stringify( object, null, '\n' );
}

remove = function( arr, index ) {
	console.log( 'index: ' + index + ', ' + arr.length );
	console.log( 'arr: ' + stringify( arr ) );
	console.log( 'after: ' + stringify( arr.slice( index+1 ) ) );
	console.log( 'before: ' + stringify( arr.slice( 0, index ) ) );
	var ret = ( index < 0 || arr.length<index )?arr:arr.slice( 0, index ).concat( arr.slice( index + 1 ) );
	//console.log( 'ret: ' + stringify( ret ) );
	return ret;
};

pickUpFirst = function( array, value ) {
	if ( array && 0 < array.length ) {
		return array[0];
	}

	return value;
}

tizen = null;
if ( fs.existsSync( './tizen-native.node' ) ) {
	tizen = require( './tizen-native.node' );
} else {
	tizen = require( './tizen-native.js' );
}

/* 주소록 관련 기능 */
exports.contacts = function( req, res ) {
    console.log( stringify( tizen.Contacts.list() ) );     
	res.send( stringify( tizen.Contacts.list() ) );     
};

exports.categories = function() {
};

exports.categories.add = function( req, res ) {
	console.log( 'Name: ' + req.body.name );
	var contacts = tizen.Contacts.addCategory( req.body.name );
	context.io.sockets.emit( 'categoryAdded', [ req.body.name ] );
};


exports.categories.remove = function( req, res ) {
	console.log( 'Name: ' + req.body.name );
	var contacts = tizen.Contacts.removeCategory( req.body.name );
	context.io.sockets.emit( 'categoryRemoved', [ req.body.name ] );
}

exports.contacts.add = function( req, res ) {
}

exports.contacts.remove = function( req, res ) {
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
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Photo] Path to list: ' + path );
	var images = tizen.Images.list( path );

	if ( !images ) {
		res.send( 403, 'Sorry, unhandled path' );
	}
	res.send( images );

}
exports.photos.upload = function( req, res ) {
}
exports.photos.download = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Photo] Path to get: ' + path );
	var image = tizen.Images.get( path );

	if ( ! image ) {
		res.send( 404, 'No image' );
		return ;
	}

	res.attachment( tizen.Util.getFilenameFrom( path ) );
	res.end( image, 'binary' );

}
exports.photos.remove = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Photo] Path to remove: ' + path );

	if ( tizen.Images.remove( path ) ) {
		context.io.sockets.emit( 'photoRemoved', path );
	}
}

/* 파일 관리 */
exports.files = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[File] Path to list: ' + path );

	var stat = tizen.Files.getAttribute( path );

	if ( stat.isDirectory() ) {
		res.send( tizen.Files.list( path ) );
	} else if ( stat.isFile() ) {
		res.attachment( tizen.Util.getFilenameFrom( path ) );
		res.end( tizen.Files.read( path ), 'binary' );
	} else {
		res.send( 403, 'Sorry, unhandled path' );
	}
}

exports.files.new = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[File] Path to add: ' + path );
	if ( tizen.Files.createDirectory( path ) ) {
		context.io.sockets.emit( 'directoryAdded', path );
	}
}

exports.files.remove = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[File] Path to remove: ' + path );

	if ( tizen.Files.remove( path ) ) {
		context.io.sockets.emit( 'fileRemoved', path );
	}

}

exports.files.move = function( req, res ) {
}

