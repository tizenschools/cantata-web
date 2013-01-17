( function() {
	Photo = File.extend( {
		defaults: {
			path: '/'
		},
		initialize: function() {
			_.bindAll( this );
			app.on( 'photoRemoved', this.removeFile );
		},
		url: function() {
			return addPath( '/photos', this.get( 'path' ) );
		}
	} );
	PhotoPreviewView = PreviewView.extend( {
		tagName: 'img',
		className: 'preview',
		initialize: function() {
			this.$el.attr( 'src', addPath( '/photos', this.model.get( 'path' ) ) );
		}
	} )

	PhotoView = FileView.extend( {
		initialize: function() {
			_.bindAll( this );
			this.model.bind( 'destroy', this.destroy, this );
			this.preview = new PhotoPreviewView( { model: this.model } ).el;
			this.name = $( '<p class="filename"></p>' );
			this.$el.append( this.preview );
			this.$el.append( this.name );
			this.name.text( this.model.getName() );
		},
	} );

	Photos = Collection.extend( {
		model: Photo,
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
			ret = '/photos' + this.parent.get( 'path' );
			debug( 'Request: {0}', ret );
			return ret;
		},
		parse: function( res ) {
			debug( 'Response: ' + res );
			ret = [];
			_.each( res, function( data ) {
				var file = new Photo( { path: addPath( this.parent.get( 'path' ), data['name'] ), name: data['name'], type: data['type'] } );
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

	PhotosView = FilesView.extend( {
		addFile: function( file ) {
			trace( 'File[{1}]: {0} added', file, file.get( 'path' ) );

			photoView = new PhotoView( { container: this.model, model: file } ).render();
			this.contents.append( photoView.el );

		},
		handleFile: function( command, options ) {
			info( '{0}: {1}', command, options );

			var selection = this.model.get( 'selection' );
			if ( ! selection ) {
				return ;
			}
			var path = selection.model.get( 'path' );
			var dialog = new QuestionDialogView( { model: new RemovePhoto( { 'path': path } ) } );
			dialog.open();

		}
	} );

	RemovePhoto = Command.extend( {
		defaults: {
			'message': 'Do you confirm to remove? ( This can\'t be recovered )'
		},
		execute: function() {
			debug( '>> Remove Photo [{0}]', this.get( 'path' ) );
			$.ajax( '/photos' + this.get( 'path' ), {
				type: 'DELETE'
			} );
		}
	} );
} ) ();
