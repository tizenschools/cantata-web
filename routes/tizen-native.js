var _ = require( 'underscore' );
var fs = require( 'fs' );
var uuid = require( 'idgen' );

var Tizen = {
};

Tizen.Util = Tizen.Util || {};

Tizen.Util.endsWith = function( str, checker ) {
	if ( str != null && checker != null && str.length >= checker.length ) {
		if( str.substr( str.length - checker.length ) == checker ) {
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
		if ( str.substr( 0, checker.toUpperCase().length ) == checker ) {
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

Tizen.System = Tizen.System || function () {
}

Tizen.System.getPhonenumber = function() {
	return '0000000000';
}

Tizen.System.getStorage = function() {

    var model = {
        'total': "2048000",
        'usage': "1024000",
        'remainder': "1024000"
    };
    return model;
}

/* FS */
Tizen.FS = Tizen.FS || function( base ) {
	this.base = base;
};

Tizen.FileAttribute = Tizen.FileAttribute || function( attr ) {
	this.attr = attr;
	this.size = attr.size;
};

Tizen.FileAttribute.prototype.getPath = function() {
	return this.attr.path;
}

Tizen.FileAttribute.prototype.exists = function() {
	return null != this.attr.type;
}

Tizen.FileAttribute.prototype.isDirectory = function() {
	return this.attr.type == 'd';
};
Tizen.FileAttribute.prototype.isFile = function() {
	return this.attr.type == 'f';
};

Tizen.FileAttribute.prototype.getName = function() {
	return this.attr.name;
};


Tizen.FS.prototype.getPath = Tizen.FS.prototype.getPath || function( path ) {
	return Tizen.Util.addPath( this.base, path );
}

Tizen.FS.prototype.getAttribute = Tizen.FS.prototype.getAttribute || function( path ) {
	var filePath = this.getPath( path );

	if ( !fs.existsSync( filePath ) ) {
		return new Tizen.FileAttribute( {
			type: null,
			name: Tizen.Util.getFilenameFrom( path ),
			path: filePath,
			size: 0
		} );
	}

	var stat = fs.statSync( filePath );
	return new Tizen.FileAttribute( {
		type: stat.isDirectory()?'d':'f',
		name: Tizen.Util.getFilenameFrom( path ),
		path: filePath,
		size: stat.size
	} );
	
};


Tizen.FS.prototype.list = Tizen.FS.prototype.list || function( path ) {
	var filePath = this.getPath( path );
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
	console.log( 'Attribute: ' + stringify( attr ) );
	if ( attr.exists() ) {
		return false;
	}
	var filePath = this.getPath( path );
	if ( options && options.type == 'd' ) {
		fs.mkdir( filePath );
	} else {
	}

	return true;
};

Tizen.FS.prototype.remove = Tizen.FS.prototype.remove || function( path, options ) {
	var filePath = this.getPath( path );

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

Tizen.FS.prototype.rename = Tizen.FS.prototype.rename || function( from, to ) {
	console.log( 'Rename :' + from + ' -> ' + to );
	fs.rename( from, to, function( err, status ) {
		if ( err ) {
			console.log( 'error: ' + stringify( err ) );
			if ( 52 == err.errno ) {
				var out = fs.createWriteStream( to );
				var inStream = fs.createReadStream( from );
				inStream.pipe( out );
				fs.unlink( from );
			}
		}

	} );
}

Tizen.FS.prototype.read = Tizen.FS.prototype.read || function( path, start, end ) {
	var filePath = this.getPath( path );

	console.log( 'File path: ' + filePath );

	var attr = this.getAttribute( path );

	if ( ! attr ) {
		return null;
	}

	if ( !attr.isFile() ) {
		return null;
	}

	var contents = fs.readFileSync( filePath );
	if ( ! start ) {
		return contents;
	}

	end = end || fs.size;
	return contents.slice( start, end );
}
Tizen.FS.prototype.stream = Tizen.FS.prototype.stream || function( path, start, end ) {
	var filePath = this.getPath( path );

	console.log( 'File path: ' + filePath );

	var attr = this.getAttribute( path );

	if ( ! attr ) {
		return null;
	}

	if ( !attr.isFile() ) {
		return null;
	}

	return fs.createReadStream( filePath, { flags: 'r', start: start, end: end } );
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
	},

	moveTo: function( from, to ) {
		return Tizen.Files.fs.rename( from, Tizen.Files.fs.getPath( to ) );
	},

	rename: function( path, newpath ) {
		var from = Tizen.Files.fs.getPath( path );
		var to = Tizen.Files.fs.getPath( newpath );
		return Tizen.Files.fs.rename( from, to );
	},
};


Tizen.Contacts = {
	model: {
		'Friedns': [ {
			"name":"손태영",
			"phoneNumber": [ "01093690102","000-0000-0002" ]
		}, {
			"name": "박윤기",
			"phoneNumber": [ "01027636239" ]
		} ],
		'Family': [ {
			"name":"이본용",
			"phoneNumber" : [ "01062527538" ]
		} ]
	},

	list: function() {
		return this.model;
	},
	addCategory: function( category ) {
		this.model[category] = [];
	},
	removeCategory: function( category ) {
		delete this.model[category];
	},
	findContactWithPhonenumber: function( phonenumber ) {
		console.log( 'Phonenumber: ' + phonenumber );
		for( category in this.model ) {
			var contacts = this.model[category];
			for ( var i = 0 ; i<contacts.length ; ++i ) {
				var contact = contacts[i];


				if ( _.contains( contact.phoneNumber, phonenumber ) ) {
					return contact;
				}
			}
		}
		return { name:'Unknown' };
	}
};



Tizen.Images = {
	fs: new Tizen.FS( Tizen.Util.addPath( __dirname, 'test/image' ) ),
	getAttribute: function( path ) {
		return Tizen.Images.fs.getAttribute( path );
	},

	list: function( path ) {
		return Tizen.Images.fs.list( path );
	},

	remove: function( path ) {
		return Tizen.Images.fs.remove( path, { recursive: true } );
	},

	read: function( path ) {
		return Tizen.Images.fs.read( path );
	},

	createDirectory: function( path ) {
		return Tizen.Images.fs.create( path, { type: 'd' } );
	},

	moveTo: function( from, to ) {
		return Tizen.Images.fs.rename( from, Tizen.Images.fs.getPath( to ) );
	},

	rename: function( path, newpath ) {
		var from = Tizen.Images.fs.getPath( path );
		var to = Tizen.Images.fs.getPath( newpath );
		return Tizen.Images.fs.rename( from, to );
	},

};


Tizen.Musics = {
	playlist: {
		top10: [
			'001 눈물이 주르륵 - 손담비.mp3',
			'002 응급실 - 정준영.mp3',
			'003 1,2,3,4 (원,투,쓰리,포) - 이하이.mp3',
			'004 하지 못한 말 - 노을.mp3',
			'005 걸어 본다 - 비원에이포(B1A4).mp3',
			'006 있기 없기 - 달샤벳(Dal★shabet).mp3',
			'007 연극이 끝난후 - 딕펑스(Dick Punks).mp3',
			'008 보여줄게 - 에일리(Ailee).mp3',
			'009 ？ (물음표) (feat. 최자 Of 다이나믹듀오, Zion.T) - 프라이머리(Primary).mp3',
			'010 그녀가 나를 보네... - 브라운 아이즈(Brown Eyes).mp3'
		],
		favorite: [
			'017 남자 없이 잘 살아 - 미쓰 에이(miss A).mp3'
		]
	},
	fs: new Tizen.FS( Tizen.Util.addPath( __dirname, 'test/music' ) ),

	list: function( path ) {
		return Tizen.Musics.fs.list( path );
	},

	getAttribute: function( path ) {
		return Tizen.Musics.fs.getAttribute( path );
	},

	get: function( path ) {
		return Tizen.Musics.fs.read( path );
	},

	stream: function( path, start, end ) {
		return Tizen.Musics.fs.stream( path, start, end );
	},

	remove: function( path ) {
		return Tizen.Musics.fs.remove( path, { recursive: true } );
	},
	getPlaylistNames: function() {
		var ret = [];
		return _.keys( this.playlist );
	},
	getPlaylist: function( name ) {
		return this.playlist[ name ];
	},
};


Tizen.Messages = {
	inbox: [
	{
		mid: '1',
		sender: '01093690102',
		time: 4000,
		text: 'Hello'
	}, {
		mid: '2',
		sender: '01027636239',
		time: 3000,
		text: 'World'
	}, 
	],
	sent: [
	{
		mid: '3',
		receiver: '01093690102',
		time: 3500,
		text: 'Hi, tyson'
	}, {
		mid: '4',
		receiver: '01027636239',
		time: 3200,
		text: 'Hello, 본용'
	}

	],
	iterate: function( f ) {
		var inboxIndex = 0;
		var sentIndex = 0;
		while ( inboxIndex < this.inbox.length || sentIndex < this.sent.length ) {
			console.log( 'inbox: ' + inboxIndex + ', sent: ' + sentIndex );
			var inboxData = ( inboxIndex < this.inbox.length )?this.inbox[inboxIndex]:{};
			var sentData = ( sentIndex < this.sent.length )?this.sent[sentIndex]:{};


			var data = null;
			if ( sentData.time && inboxData.time ) {
				if ( sentData.time < inboxData.time ) {
					++inboxIndex;
					data = inboxData;
				} else {
					++sentIndex;
					data = sentData;
				}
			} else if ( sentData.time ) {
				++sentIndex;
				data = sentData;
			} else if ( inboxData.time ) {
				++inboxIndex;
				data = inboxData;
			}

			console.log( data );
			
			f( data );
		}
	},
	listeners: [],

	addListener: function( listener ) {
		this.listeners.push( listener );
	},
	getSessions: function() {
		var ret = [];
		var containings = {};
		this.iterate( function( data ) {
			if ( data.sender ) {
				if ( ! containings[data.sender] ) {
					containings[data.sender] = true;
					ret.push( { mid: data.mid, sender: data.sender, time: data.time, text: data.text, name: Tizen.Contacts.findContactWithPhonenumber( data.sender ).name } );
				}
			} else {
				if ( ! containings[data.receiver] ) {
					containings[data.receiver] = true;
					ret.push( { mid: data.mid, receiver: data.receiver, time: data.time, text: data.text, name: Tizen.Contacts.findContactWithPhonenumber( data.receiver ).name } );
				}
			}
		} );
		return ret;
	},

	getMessages: function( id ) {
		if ( ! id ) {
			return ;
		}
		var ret = [];
		var con = {};
		this.iterate( function( data ) {
			console.log( 'context: ' + stringify( con ) );
			if ( id == data['mid'] ) {
				con.target = data.sender || data.receiver;
			}
			console.log( 'context: ' + stringify( con ) );
			if ( con.target ) {
				if ( data.sender == con.target || data.receiver == con.target ) {
					ret.push( data );
				}
			}
		} );
		return ret;
	},
	send: function( sender, receiver, text ) {
		console.log( 'sender: ' + sender + ', receiver: ' + receiver + ', text: ' + text );
		this.sent.unshift( {
			mid: uuid(),
			receiver: receiver,
			text: text,
			time: new Date().getTime()
		} );
		console.log( stringify(  this.sent ) );
	}
}

exports.Util = Tizen.Util;
exports.System = Tizen.System;
exports.Files = Tizen.Files;
exports.Images = Tizen.Images;
exports.Musics = Tizen.Musics;
exports.Contacts = Tizen.Contacts;
exports.Messages = Tizen.Messages;
