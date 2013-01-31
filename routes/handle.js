var _ = require( 'underscore' );
var fs = require( 'fs' );

stringify = function( object ) {
	return JSON.stringify( object, null, '\n' );
};

remove = function( arr, index ) {
	console.log( 'index: ' + index + ', ' + arr.length );
	console.log( 'arr: ' + stringify( arr ) );
	console.log( 'after: ' + stringify( arr.slice( index+1 ) ) );
	console.log( 'before: ' + stringify( arr.slice( 0, index ) ) );
	var ret = ( index < 0 || arr.length<index )?arr:arr.slice( 0, index ).concat( arr.slice( index + 1 ) );
	return ret;
};

pickUpFirst = function( array, value ) {
	if ( array && 0 < array.length ) {
		return array[0];
	}

	return value;
};

tizen = null;
if ( fs.existsSync( './tizen-native.node' ) ) {
	tizen = require( './tizen-native.node' );
} else {
	tizen = require( './tizen-native.js' );
}

/* 시스템 관련 기능 */
exports.system = function() {
};

exports.system.storage = function( req, res ) {
    console.log( 'GET system/storage header host: ' + req.header('host') );
    res.send( stringify( tizen.System.getStorage() ) );
};


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
};

exports.contacts.add = function( req, res ) {
};

exports.contacts.remove = function( req, res ) {
};

exports.contacts.details = function( req, res ) {
};

/* 문자 관련 기능 */
exports.sessions = function( req, res ) {
	res.send( tizen.Messages.getSessions() );
};
exports.messages = function( req, res ) {
	res.send( tizen.Messages.getMessages( req.params.mid ) );
};

exports.messages.send = function( req, res ) {
	tizen.Messages.send( req.body.sender|| tizen.System.getPhonenumber(), req.body.receiver, req.body.text );
};

tizen.Messages.addListener( function() {
	// 문자 리스너 바이딩
} );


/* 음악 관련 기능 */
exports.musics = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Music] Path to list: ' + path );
	var images = tizen.Musics.list( path );

	if ( !images ) {
		res.send( 403, 'Sorry, unhandled path' );
	}
	res.send( images );
};

exports.musics.upload = function( req, res ) {
};

exports.musics.download = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Musics] Path to get: ' + path );

	if ( typeof req.headers.range == 'undefined' ) {
		var contents = tizen.Musics.get( path );
		if ( ! contents ) {
			res.send( 404, 'No music' );
			return ;
		}

		res.attachment( tizen.Util.getFilenameFrom( path ) );
		res.end( contents, 'binary' );
	} else {
		var header = {};
		var range = req.headers.range;
		var parts = range.replace( /bytes=/, '' ).split( '-' );
		var partialStart = parts[0];
		var partialEnd = parts[1];

		var stat = tizen.Musics.getAttribute( path );
		console.log( 'stat: ' + stringify( stat ) );
		var total = stat['size'];

		var start = parseInt( partialStart, 10 );
		var end = partialEnd?parseInt( partialEnd, 10 ): total-1;;


		header["Content-Range"] = "bytes " + start + "-" + end + "/" + (total);
		header["Accept-Ranges"] = "bytes";
		header["Content-Length"]= (end-start)+1;
		header['Transfer-Encoding'] = 'chunked';
		header["Connection"] = "close";

		console.log( 'Header: ' + stringify( header ) );

		res.writeHead( 206, header ); 
		tizen.Musics.stream( path, start, end ).pipe( res );
	}
}

exports.musics.remove = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Musics] Path to remove: ' + path );

	if ( tizen.Musics.remove( path ) ) {
		context.io.sockets.emit( 'musicRemoved', path );
	}
};

exports.playlists = function( req, res ) {
	res.send( tizen.Musics.getPlaylistNames() );
};
exports.playlists.get = function( req, res ) {
	res.send( tizen.Musics.getPlaylist( req.params.name ) );
};

/* 사진 관련 기능 */
exports.photos = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Photo] Path to list: ' + path );
	var stat = tizen.Images.getAttribute( path );
	if ( stat.isDirectory() ) {
		res.send( tizen.Images.list( path ) );
	} else if ( stat.isFile() ) {
		console.log( '[Photo] ' + path + ' downloaded' );
		var image = tizen.Images.read( path );
		res.attachment( tizen.Util.getFilenameFrom( path ) );
		res.end( image, 'binary' );
	}


};
exports.photos.new = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Photo] Path : ' + path );
	var stat = tizen.Images.getAttribute( path );
	if ( stat.exists() ) {
		console.log( '[Photo] Files upload' );

		if ( Array.isArray( req.files.files ) ) {
			_.each( req.files.files, function( file ) {
				var tmpPath = file.path;
				var fileName = file.filename;

				tizen.Images.moveTo( tmpPath, tizen.Util.addPath( path, fileName ) );
				context.io.sockets.emit( 'photoAdded', path );
			} );
			res.end();
		} else if ( req.files.files ) {
			var tmpPath = req.files.files.path;
			var fileName = req.files.files.filename;

			tizen.Images.moveTo( tmpPath, tizen.Util.addPath( path, fileName ) );
			res.end();
			context.io.sockets.emit( 'photoAdded', path );
		} else {
			res.end( 500 );
		}
	} else if ( tizen.Images.createDirectory( path ) ) {
		console.log( '[Photo] Directory( ' + stat.getPath() + ' ) created' );
		context.io.sockets.emit( 'photoDirectoryAdded', path );
	}
};
exports.photos.remove = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[Photo] Path to remove: ' + path );

	if ( tizen.Images.remove( path ) ) {
		context.io.sockets.emit( 'photoRemoved', path );
	}
};

/* 파일 관리 */
exports.files = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[File] Path to list: ' + path );

	var stat = tizen.Files.getAttribute( path );

	if ( stat.isDirectory() ) {
		res.send( tizen.Files.list( path ) );
	} else if ( stat.isFile() ) {
		console.log( 'File( ' + path + ' ) downloaded' );
		res.attachment( tizen.Util.getFilenameFrom( path ) );
		res.end( tizen.Files.read( path ), 'binary' );
	} else {
		res.send( 403, 'Sorry, unhandled path' );
	}
};

exports.files.new = function( req, res, next ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[File] Path : ' + path );
	var stat = tizen.Files.getAttribute( path );
	if ( stat.exists() ) {
		console.log( '[File] Files upload' );

		console.log( stringify( req.files ) );

		if ( Array.isArray( req.files.files ) ) {
			_.each( req.files.files, function( file ) {
				var tmpPath = file.path;
				var fileName = file.filename;

				tizen.Files.moveTo( tmpPath, tizen.Util.addPath( path, fileName ) );
			} );
			res.end();
		} else if ( req.files.files ) {
			var tmpPath = req.files.files.path;
			var fileName = req.files.files.filename;

			tizen.Files.moveTo( tmpPath, tizen.Util.addPath( path, fileName ) );
			res.end();
		} else {
			res.send( 500 );
		}
	} else if ( tizen.Files.createDirectory( path ) ) {
		console.log( '[File] Directory( ' + stat.getPath() + ' ) created' );
		context.io.sockets.emit( 'directoryAdded', path );
	}
};

exports.files.remove = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[File] Path to remove: ' + path );

	if ( tizen.Files.remove( path ) ) {
		context.io.sockets.emit( 'fileRemoved', path );
	}

};

exports.files.move = function( req, res ) {
	var path = pickUpFirst( req.params, '/' );
	console.log( '[File] Path to rename: ' + path + ', body: ' + stringify( req.body ) );

	if ( req.body.newpath ) {
		if ( tizen.Files.rename( path, req.body.newpath ) ) {
			context.io.sockets.emit( 'fileRenamed', { path: path, newpath: newpath } );
		}
	}


};

