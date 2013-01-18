( function() {
	Music = Model.extend( {
	} );
	Playlist = Collection.extend( {
	} );

	MusicPlayerDialogView = WindowView.extend( {

		title: 'Music player',

		templateId: '#music-player-template',

		initialize: function() {
			this.width = 422;
			this.height = 300;
			this.$player = $( this.template( this.model ) );
		},

		createContents: function() {
			this.contents.append( this.$player );
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
			var loadBtn = new Button( { name: 'Load', model: new OpenPlaylistCommand() } ).render();
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
			return this.contents = $( '<div></div>' );
		},
		openPlaylist: function( e, data ) {
			var selected = this.$( 'input:checked' );
			debug( 'Selected: {0}', selected.val() );
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
			this.contents.empty();
			this.collection.each( function( file ) {
				this.addPlaylist( file );
			}, this );
		},
		addPlaylist: function( playlist ) {
			trace( 'Playlist[{0}] added',  playlist.get( 'name' ) );
			this.contents.append( new MusicPlaylistView( { model: playlist } ).render().el );
		},

	} );
	OpenPlaylistCommand	= Command.extend( {
		execute: function() {
			new PlaylistDialogView().open( this.open );
		},
		open: function() {
			info( '{0}: {1}', command, options );
		}
	} );
} ) ();
