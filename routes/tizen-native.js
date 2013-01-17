var _ = require( 'underscore' );
var fs = require( 'fs' );

var Tizen = {
};

Tizen.Util = Tizen.Util || {};

Tizen.Util.endsWith = function( str, checker ) {
	if ( str != null && checker != null && str.length >= checker.length ) {
		if( str.substr( str.length - checker.length ).toUpperCase() == checker.toUpperCase() ) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

Tizen.Util.startsWith = function( str, checker ) {
	if ( str != null && checker != null && str.length >= checker.length ) {
		if ( str.toUpperCase().substr( 0, checker.toUpperCase().length ) == checker.toUpperCase() ) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}
Tizen.Util.addPath = function( path1, path2 ) {
	if ( ! path1 ) {
		return path2;
	} else if ( ! path2 ) {
		return path1;
	}

	if ( Tizen.Util.endsWith( path1, '/' ) ) {
		return Tizen.Util.addPath( path1.substr( 0, path1.length - 1 ), path2 );
	} else if ( Tizen.Util.startsWith( path2, '/' ) ) {
		return Tizen.Util.addPath( path1, path2.substr( 1 ) );
	} else {
		return path1 + '/' + path2;
	}
}

Tizen.Util.getFilenameFrom = function( path ) {
	var index = path.lastIndexOf( '/' );
	if ( index < 0 ) {
		return path;
	}

	return path.substr( index + 1 );
}

Tizen.Util.getParentFrom = function( path ) {
	var index = path.lastIndexOf( '/' );
	if ( index <= 0 ) {
		return '/';
	}

	return path.substr( 0, index );
}


/* FS */
Tizen.FS = Tizen.FS || function( base ) {
	this.base = base;
};

Tizen.FS.FileAttribute = Tizen.FS.FileAttribute || function( attr ) {
	this.attr = attr;
};

Tizen.FS.FileAttribute.prototype.isDirectory = function() {
	return this.attr.type == 'd';
};
Tizen.FS.FileAttribute.prototype.isFile = function() {
	return this.attr.type == 'f';
};

Tizen.FS.FileAttribute.prototype.getName = function() {
	return this.attr.name;
};


Tizen.FS.prototype.getAttribute = Tizen.FS.prototype.getAttribute || function( path ) {
	var filePath = Tizen.Util.addPath( this.base, path );

	if ( !fs.existsSync( filePath ) ) {
		return null;
	}

	var stat = fs.statSync( filePath );
	var ret = new Tizen.FS.FileAttribute( {
		type: stat.isDirectory()?'d':'f',
		name: Tizen.Util.getFilenameFrom( path )
	} );
	
	return ret;
};


Tizen.FS.prototype.list = Tizen.FS.prototype.list || function( path ) {
	var filePath = Tizen.Util.addPath( this.base, path );
	var ret = [];

	var stat = fs.statSync( filePath );
	if ( stat.isDirectory() ) {
		var children = fs.readdirSync( filePath );

		_.each( children, function( child ) {
			var stat = fs.statSync( Tizen.Util.addPath( filePath, child ) );
			var fileO = {
				type: stat.isDirectory()?'d':'f',
				name: child
			};
			ret.push( fileO );
		} );

		return ret;
	} else if ( stat.isFile() ) {
		return null;
	} else {
		return null;
	}
};

Tizen.FS.prototype.create = Tizen.FS.prototype.create || function( path, options ) {
	var attr = this.getAttribute( path );
	if ( attr ) {
		return false;
	}
	var filePath = Tizen.Util.addPath( this.base, path );
	if ( options && options.type == 'd' ) {
		fs.mkdir( filePath );
	} else {
	}

	return true;
};

Tizen.FS.prototype.remove = Tizen.FS.prototype.remove || function( path, options ) {
	var filePath = Tizen.Util.addPath( this.base, path );

	console.log( 'file path: ' + filePath );

	if ( fs.statSync( filePath ).isDirectory() ) {
		var children = fs.readdirSync( filePath );

		console.log( 'No chlid' + children.length );
		if ( 0 < children.length ) {
			if ( ! options['recursive'] ) {
				return false;
			}
			_.each( children, function( child ) {
				this.remove( addPath( path, child ), options );
			} );
		}

		fs.rmdir( filePath );
	} else {
		fs.unlink( filePath );
	}
	return true;
};

Tizen.FS.prototype.read = Tizen.FS.prototype.read || function( path ) {
	var filePath = Tizen.Util.addPath( this.base, path );

	console.log( 'File path: ' + filePath );

	var attr = this.getAttribute( path );

	if ( ! attr ) {
		return null;
	}

	if ( !attr.isFile() ) {
		return null;
	}

	var contents = fs.readFileSync( filePath );

	return contents;
}

Tizen.Files = Tizen.Files || {
	fs: new Tizen.FS( Tizen.Util.addPath( __dirname, 'test/file' ) ),
	getAttribute: function( path ) {
		return Tizen.Files.fs.getAttribute( path );
	},

	read: function( path ) {
		return Tizen.Files.fs.read( path );
	},
	list: function( path ) {
		return Tizen.Files.fs.list( path );
	},

	createDirectory: function( path ) {
		return Tizen.Files.fs.create( path, { type: 'd' } );
	},

	remove: function( path ) {
		return Tizen.Files.fs.remove( path, { recursive: true } );
	}
};


Tizen.Contacts = {

	list: function() {
		return Tizen.Contacts.model;
	},
	addCategory: function( category ) {
		Tizen.Contacts.model[category] = [];
	},
	removeCategory: function( category ) {
		delete Tizen.Contacts.model[category];
	}
};

Tizen.Contacts.model = {
	'Friedns': [ {
		"name":"A",
		"phoneNumber": [ "000-0000-0001","000-0000-0002" ]
	}, {
		"name": "B",
		"phoneNumber": [ "000-0000-0003" ]
	} ],
	'Family': [ {
		"name":"c",
		"phoneNumber" : [ "000-0000-0004" ]
	} ]
};

Tizen.Image = Tizen.Image || function() {};

Tizen.Images = {
	fs: new Tizen.FS( Tizen.Util.addPath( __dirname, 'test/image' ) ),
	list: function( path ) {
		return Tizen.Images.fs.list( path );
	},

	get: function( path ) {
		var attr = Tizen.Images.fs.getAttribute( path );
		console.log( 'Attr: ' + JSON.stringify( attr ) );
		return Tizen.Images.fs.read( path );
	},

	remove: function( path ) {
		return Tizen.Images.fs.remove( path, { recursive: true } );
	}
}

exports.Util = Tizen.Util;
exports.Files = Tizen.Files;
exports.Images = Tizen.Images;
exports.Contacts = Tizen.Contacts;
