( function() {
	Music = Model.extend( {
		defaults: {
			title: 'Title',
			artist: 'Title',
			mp3: 'Title',
			poster: null,
		},
	} );
	MusicList = Collection.extend( {
		model: Music,
		setName: function( name ) {
			this.name = name;
			this.fetch();
		},
		url: function( name ) {
			return addPath( '/playlists', this.name );
		},
		parse: function( res ) {
			trace( '<< Musics for {0}', this.name );
			var ret = _.map( res, function( path ) {
				return { title: path, artist: 'Unknown', mp3: addPath( '/musics', path ) };
			} );
			debug( 'Musics: {0}', JSON.stringify( ret ) );
			return ret;
		},
	} );
	MusicFile = File.extend( {
		defaults: {
			path: '/'
		},
		initialize: function() {
			_.bindAll( this );
			app.on( 'musicRemoved', this.removeFile );
		},
		url: function() {
			return addPath( '/musics', this.get( 'path' ) );
		}
	} );
	MusicFiles = Collection.extend( {
		model: MusicFile,
		initialize: function( array, options ) {
			_.bindAll( this );
			app.on( 'directoryAdded', this.addDirectory );
			this.parent = options.parent;
			this.parent.bind( 'destroy', this.destroy, this );
			this.parent.bind( 'change', this.changed, this );
		},
		changed: function() {
			trace( 'Changed' );
			if ( this.parent.hasChanged( 'path' ) ) {
				this.fetch()
			} else if ( this.parent.hasChanged( 'selection' ) ) {
				if ( this.selection ) {
					this.selection.$el.removeClass( 'selection' );
				}
				this.selection = this.parent.get( 'selection' );
				if ( this.selection ) {
					this.selection.$el.addClass( 'selection' );
				}
			}
		},
		comparator: function( model ) {
			return model.get( 'type' ) + model.get( 'name' );
		},
		url: function() {
			ret = '/musics' + this.parent.get( 'path' );
			debug( 'Request: {0}', ret );
			return ret;
		},
		parse: function( res ) {
			debug( 'Response: ' + res );
			ret = [];
			_.each( res, function( data ) {
				var file = new MusicFile( { path: addPath( this.parent.get( 'path' ), data['name'] ), name: data['name'], type: data['type'] } );
				ret.push( file );
			}, this );
			return ret;
		},
		addDirectory: function( data ) {
			var parentDir = getParentFrom( data );
			var name = getFilenameFrom( data );

			if ( this.parent.get( 'path' ) == parentDir ) {
				var index = this.indexOf( this.find( function( existFile ) {
					if ( existFile.get( 'type' ) == 'f' ) {
						return true;
					}

					return ( name < existFile.get( 'name' ) );
				} ) );
				debug( 'Index: {0}', index );
				this.add( { path: data, name: name, type: 'd' }, { at: index } );
			}
		}
	} );

	MusicPlayerDialogView = WindowView.extend( {

		title: 'Music player',

		templateId: '#music-player-template',

		hideTemplate:
		'<div>' +
		'</div>',

		initialize: function() {
			this.width = 422;
			this.height = 300;
			this.collection = this.collection || new MusicList();
			_.bindAll( this );
			this.collection.bind( 'reset', this.resetMusic, this );
			this.collection.bind( 'add', this.addMusic, this );
			this.$player = $( this.template( this.model ) );
		},

        getTitle: function() {
			return this.title;
        },

        setTitle: function( title ) {
        	this.title = title;
        	this.$header = this.wnd.getHeader();
        	this.$header.find( '.window_title_text' ).text( this.getTitle() );
        },

		createButton: function( name, execute ) {
			var btn = new Button( { name: name, model: new Command( { execute: execute } ) } );
			btn.render();
			return btn.el;
		},

		createFooter: function() {
			debug( 'Create footer' );
			var that = this;
			this.footer = $( '<div id="footer"></div>' );
			this.footer.append( this.createButton( 'Music file', this.changeContentsByMusicFileManager ) );
			this.footer.append( this.createButton( 'Music player', this.changeContentsByMusicPlayer ) );
			this.footer.find('.btn:last').hide();

			return this.footer;
		},

		changeContentsByMusicFileManager: function() {
			trace( 'changeContents music file manager' );

			// change title
			this.setTitle( 'Music file manager' );

			// change content
			this.$body.hide();
			this.$body2.show();
			//this.wnd.getFrame().append( this.$filesManager.$body );
			//this.$body = this.wnd.getFrame().find( '#contents' );

			// change footer 
			this.$footerbt1.hide();
			this.$footerbt2.show();
			//this.wnd.getFooter().find( '#footer' ).remove();
			//this.wnd.getFooter().append( this.footer2 );
		},

		changeContentsByMusicPlayer: function() {
			trace( 'changeContents music player' );

			// change title
			this.setTitle( 'Music player' );

			// change content
			this.$body2.hide();
			this.$body.show();
			//this.$body = this.wnd.getFrame().find( '#contents' );

			// change footer 
			this.$footerbt2.hide();
			this.$footerbt1.show();
			//this.wnd.getFooter().find( '#footer' ).remove();
			//this.wnd.getFooter().append( this.footer );
		},

		createContents: function() {
			this.$footerbt1 = this.wnd.getFooter().find('.btn:first');
			this.$footerbt2 = this.wnd.getFooter().find('.btn:last');

			// create music file manager contents
			this.$hideContents = $( this.template( this.model, this.hideTemplate ) );
			this.$hideContents.hide();
			this.wnd.getFrame().append( this.$hideContents );

			var path = new File(); // create file content, but not visible
			var files = new MusicFiles( [], { parent: path } );
			this.$filesManager = new MusicFilesView( { el: this.$hideContents, model: path, collection: files } );
			this.$filesManager.render();
			this.$body2 = this.$filesManager.$body;
			this.$body2.hide();
			this.wnd.getFrame().append( this.$body2 );

			// create music player contents
			this.$body.append( this.$player );
			this.$playList = new jPlayerPlaylist( {
				jPlayer: '#jp_player',
				cssSelectorAncestor: '#jp_container'
			}, [
			/*{
				title:"Cro Magnon Man",
				artist:"The Stark Palace",
				mp3:"http://www.jplayer.org/audio/mp3/TSP-01-Cro_magnon_man.mp3",
				oga:"http://www.jplayer.org/audio/ogg/TSP-01-Cro_magnon_man.ogg",
				poster: "http://www.jplayer.org/audio/poster/The_Stark_Palace_640x360.png"
			}*/
		   	],
			{
				swfPath: 'js',
				supplied: 'mp3'
			} );
			var $new = this.$player.find( '#jp-playlist-new' );
			var $load = this.$player.find( '#jp-playlist-load' );
			var $save = this.$player.find( '#jp-playlist-save' );
			var $add = this.$player.find( '#jp-playlist-add' );
			var $remove = this.$player.find( '#jp-playlist-remove' );

			new Button( { el: $new, model: new Command( {
				execute: function() {
					console.log( 'hello' );
				}
			} )  } ).render();
			var controls = this.$player.find( '.jp-playlist-control' );
			var newBtn = new Button( { name: 'New', model: new Command( {
				execute: function() {
				}
			} ) } ).render();
			var loadBtn = new Button( { name: 'Load', model: new OpenPlaylistCommand( { musics: this.collection } ) } ).render();
			var saveBtn = new Button( { name: 'Save', model: new Command( {
				execute: function() {
				}
			} ) } ).render();
			var addBtn = new Button( { name: 'Add', model: new Command( {
				execute: function() {
				}
			} ) } ).render();
			var removeBtn = new Button( { name: 'Remove', model: new Command( {
				execute: function() {
				}
			} ) } ).render();

			controls.append( loadBtn.$el );
		},
		resetMusic: function() {
			this.$playList.setPlaylist( [] );
			this.collection.each( this.addMusic );
		},

		addMusic: function( music ) {
			var json = music.toJSON();
			debug( 'Music to add: {0}', JSON.stringify( json ) );
			this.$playList.add( music.toJSON() );
		}
	} );

	MusicPlaylist = Model.extend( {
	} );
	MusicPlaylistView = View.extend( {
		defaultTemplate: '<input type="radio" name="playlist" value="{{name}}">{{name}}',
	} );

	MusicPlaylists = Collection.extend( {
		model: MusicPlaylist,
		url: function( options ) {
			return '/playlists';
		},
		parse: function( res ) {
			return _.map( res, function( obj ) {
				return { name: obj };
			} );
		}
	} );
	PlaylistDialogView = DialogView.extend( {
		title: 'Open playlist',
		templateId: '#playlist',
		initializeEvents: function() {
			_.bindAll( this );
			this.collection = this.collection || new MusicPlaylists();
			this.collection.bind( 'reset', this.resetPlaylist, this );
			this.collection.bind( 'add', this.addPlaylist, this );
		},
		createContents: function() {
			this.collection.fetch();
			return null;
		},
		openPlaylist: function( e, data ) {
			var selected = this.$( 'input:checked' );
			debug( 'Selected: {0}', selected.val() );
			this.args = selected.val();
			this.close();
		},

		addButtons: function( footer ) {
			var cancel = $( '<button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>' );
			this.addButton( 'cancel', cancel );
			footer.append( cancel );

			var open = $( '<button class="btn btn-primary"><span>Open</span></button>' );
			footer.append( open );
			this.addButton( 'open', open, this.openPlaylist );
		},

		resetPlaylist: function() {
			debug( 'Playlist reset' );
			this.$body.empty();
			this.collection.each( function( file ) {
				this.addPlaylist( file );
			}, this );
		},
		addPlaylist: function( playlist ) {
			trace( 'Playlist[{0}] added',  playlist.get( 'name' ) );
			this.$body.append( new MusicPlaylistView( { model: playlist } ).render().el );
		},

	} );
	OpenPlaylistCommand	= Command.extend( {
		execute: function() {
			new PlaylistDialogView().open( this.open );
		},
		open: function( command, name ) {
			info( '{0}: {1}', command, name );
			this.get( 'musics' ).setName( name );
		}
	} );

	MusicFilesView = FilesView.extend( {
		handleFile: function( command, options ) {
			info( '{0}: {1}', command, options );

			var selection = this.model.get( 'selection' );
			if ( ! selection ) {
				return ;
			}
			var path = selection.model.get( 'path' );

			switch( command ) {
				case 'delete':
					var dialog = new QuestionDialogView( { model: new RemoveMusicFile( { 'path': path } ) } );
					dialog.open();
					break;
				case 'rename':
					var dialog = new InputDialogView( { model: new RenameMusicFile( { 'path': path } ) } );
					dialog.open();
					break;
			}
		},

		getCommand: function( command ) {
			if ( 'upload' == command ) {
				return new UploadFile( { url: '/musics', path: this.model.get( 'path' ) } );
			} else if ( 'newdirectory' == command ) {
				return new NewDirectory( { path: this.model.get( 'path' ) } );
			}
		},
	} );

	MusicFilesDialogView = FilesDialogView.extend( {
		title: 'Music file',
		addButtons: function( footer ) {
			var no = $( '<button class="btn" data-dismiss="modal" aria-hidden="true">No</button>' );
			this.addButton( 'no', no );
			footer.append( no );

			var yes = $( '<button class="btn btn-primary">Yes</button>' );
			footer.append( yes );
			this.addButton( 'yes', yes, [ this.done, this.close ] );
		},
		handleFile: function( command, options ) {
			info( '{0}: {1}', command, options );

			var selection = this.model.get( 'selection' );
			if ( ! selection ) {
				return ;
			}
			var path = selection.model.get( 'path' );

			switch( command ) {
				case 'delete':
					var dialog = new QuestionDialogView( { model: new RemoveMusicFile( { 'path': path } ) } );
					dialog.open();
					break;
				case 'rename':
					var dialog = new InputDialogView( { model: new RenameMusicFile( { 'path': path } ) } );
					dialog.open();
					break;
			}
		}
	} );

	RemoveMusicFile = Command.extend( {
		defaults: {
			'message': 'Do you confirm to remove? ( This can\'t be recovered )'
		},
		execute: function() {
			debug( '>> Remove Music File [{0}]', this.get( 'path' ) );
			$.ajax( '/musics' + this.get( 'path' ), {
				type: 'DELETE'
			} );
		}
	} );
	RenameMusicFile = Command.extend( {
		defaults: {
			'message': 'Input new name?'
		},
		execute: function( name ) {
			var path = this.get( 'path' );
			debug( '>> Rename Music File [{0}] to [{1}]', path, name );
			$.ajax( addPath( '/musics', this.get( 'path' ) ), {
				type: 'PUT',
				data: { newpath: addPath( getParentFrom( path ), name ) }
			} );
		}
	} );

} ) ();
