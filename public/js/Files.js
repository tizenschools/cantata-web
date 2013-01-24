( function() {

	File = Model.extend( {
		defaults: {
			path: '/'
		},
		initialize: function() {
			_.bindAll( this );
			app.on( 'fileRemoved', this.removeFile );
		},
		getName: function() {
			return getFilenameFrom( this.get( 'path' ) );
		},
		removeFile: function( data ) {
			if ( this.get( 'path' ) == data ) {
				this.destroy();
			}
		},
		url: function() {
			return addPath( '/files', this.get( 'path' ) );
		}
	} );
	PreviewView = View.extend( {
		className: 'preview',
		initialize: function() {
			this.$el.text( 'preview' );
		}
	} )
	FileView = View.extend( {
		events: {
			'click': 'select',
			'dblclick': 'open',
		},
		className: 'file ui-widget-content',
		initialize: function() {
			_.bindAll( this );
			this.model.bind( 'destroy', this.destroy, this );
			this.preview = new PreviewView( { model: this.model } ).el;
			this.name = $( '<p class="filename"></p>' );
			this.$el.append( this.preview );
			this.$el.append( this.name );
			this.name.text( this.model.getName() );
		},
		render: function() {
			return this;
		},
		open: function( view ) {
			debug( 'Old path: {0}, New path: {1}', this.options.container.get( 'path' ), this.model.get( 'path' ) );
			if ( this.options.container.get( 'path' ) == this.model.get( 'path' ) ) {
				return ;
			}

			info( 'Open {0}', view );
			if ( 'd' == this.model.get( 'type' ) ) {
				this.options.container.set( 'path', this.model.get( 'path' ) );
			} else if ( 'f' == this.model.get( 'type' ) ) {
				var url = this.model.url();
				debug( 'File url: {0}', url );
				var iframe = $('<form id="formtemp" action="'+ url +'" method="get"></form>');
				iframe.appendTo('body');
				iframe.submit();
				iframe.remove();
			}
		},
		select: function( event ) {
			debug( 'Select: {0}', this.$el );
			this.options.container.set( 'selection', this );
		},
		destroy: function() {
			this.$el.remove();
		}
	} );

	Files = Collection.extend( {
		model: File,
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
			ret = '/files' + this.parent.get( 'path' );
			debug( 'Request: {0}', ret );
			return ret;
		},
		parse: function( res ) {
			debug( 'Response: ' + res );
			var that = this;
			ret = [];
			_.each( res, function( data ) {
				var file = that.create( { path: addPath( this.parent.get( 'path' ), data['name'] ), name: data['name'], type: data['type'] } );
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

	FilesView = WindowView.extend( {
		initialize: function() {
			_.bindAll( this );
			this.model.bind( 'destroy', this.close, this );
			this.model.bind( 'change', this.pathChanged, this );
			this.collection.bind( 'reset', this.resetFile, this );
			this.collection.bind( 'add', this.addFile, this );
			this.collection.fetch();
		},
		getTitle: function() {
			return this.model.get( 'path' );
		},
		createContents: function() {
			this.contents.contextMenu( {
				selector: '.file.selection',
				callback: this.handleFile,
				items: {
					//'paste': { name: 'Paste' },
					'move': { name: '잘라내기' },
					'copy': { name: '복사' },
					'sep1': "---------",
					'delete': { name: '삭제' },
					'rename': { name: '이름바꾸기' },
				}
			} );
			this.resetFile();
		},
		createFooter: function() {
			debug( 'Create footer' );
			that = this;
			this.footer = $( '<div id="footer"></div>' );
			var toUpBtn = new Button( {
				name: 'Up',
				model: new Command( {
					execute: function() {
						var path = that.model.get( 'path' );
						var p = getParentFrom( path );
						debug( 'Move to up: {0}', p );
						that.model.set( 'path', p );
					}
				} )
		   	} ).render();

			var newDirectoryBtn = new Button( {
				name: '+',
				model: new Command( {
					execute: function() {
						var dialog = new InputDialogView( { model: new NewDirectory( {
							path: that.model.get( 'path' ),
						} ) } );
						dialog.open();
					}
				} )
			} ).render();


			var uploadBtn = new Button( {
				name: 'Upload',
				model: new Command( {
					execute: function() {
						var dialog = new UploadDialogView( { model: new Model( {
							path: that.model.get( 'path' ),
							execute: function( args ) {
								trace( 'Args: {0}, Files: {1}', args, args.files );

								args.fileupload( 'send', { files: args.files } );
							}
						} ) } );
						dialog.open();
					}
				} )
			} );

			this.footer.append( toUpBtn.el );
			this.footer.append( newDirectoryBtn.el );
			this.footer.append( uploadBtn.el );
			return this.footer;
		},
		addFile: function( file ) {
			trace( 'File[{1}]: {0} added', file, file.get( 'path' ) );

			var view = new FileView( { container: this.model, model: file } ).render();
			this.contents.append( view.el );

		},
		removeFile: function( file ) {
			trace( 'File[{1}]: {0} removed', file, file.get( 'path' ) );
		},
		resetFile: function() {
			debug( 'Files reset' );
			this.contents.empty();
			this.collection.each( function( file ) {
				this.addFile( file );
			}, this );
		},
		pathChanged: function() {
			if ( ! this.model.hasChanged( 'path' ) ) {
				return ;
			}

			if ( this.wnd ) {
				this.wnd.setTitle( this.getTitle() );
			}
		},
		handleFile: function( command, options ) {
			info( '{0}: {1}', command, options );

			var selection = this.model.get( 'selection' );
			if ( ! selection ) {
				return ;
			}
			var path = selection.model.get( 'path' );
			var dialog = new QuestionDialogView( { model: new RemoveFile( { 'path': path } ) } );
			dialog.open();

		}
	} );

	RemoveFile = Command.extend( {
		defaults: {
			'message': 'Do you confirm to remove? ( This can\'t be recovered )'
		},
		execute: function() {
			debug( '>> Remove File [{0}]', this.get( 'path' ) );
			$.ajax( '/files' + this.get( 'path' ), {
				type: 'DELETE'
			} );
		}
	} );
	
	NewDirectory = Command.extend( {
		defaults: {
			'message': 'Input new directory name?'
		},
		execute: function( name ) {
			debug( '>> New directory [{0}] in [{1}]', name, this.get( 'path' ) );
			$.ajax( addPath( '/files', addPath( this.get( 'path' ), name ) ), {
				type: 'POST',
				data: { name: name },
			} );
		}
	} );

	UploadDialogView = DialogView.extend( {
		title: 'Upload files',
		templateId: '#uploadForm',
		createContents: function() {
			this.args = $( this.template( this.model ) );
			var files = this.args.files = [];
			this.args.fileupload( {
				url: addPath( '/files', this.model.get( 'path' ) ),
				dataType: 'json',
				add: function( e, data ) {
					that  = files;
					_.each( data.files, function( file ) {
						debug( 'File name: {0}', file.name );

						var model = _.find( that, function( exist )  {
							return ( exist.name == file.name );
						} )
						if ( ! model ) {
							model = new Model( { name:file.name, size: file.size, file: file } );
							that.push( file );
							var subView = new UploadFileView( { model: model } );
							subView.render().$el.appendTo( '#uploads' );
						} else {
							model.set( 'size', file.size );
							model.set( 'file', file );
						}
					} );
				},
				done: function( e, data ) {
				}
			} );

			return this.args;
		},

		addButtons: function( footer ) {
			var cancel = $( '<button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>' );
			this.addButton( 'cancel', cancel );
			footer.append( cancel );

			var start = $( '<button class="btn btn-primary start"><i class="icon-upload icon-white"></i><span>Start</span></button>' );
			footer.append( start );
			this.addButton( 'start', start, this.done );

		},
	} );
	UploadFileView = View.extend( {
		tagName: 'tr',
		templateId: '#uploadFile',
		initialize: function() {
			View.prototype.initialize.call( this );
			this.model.bind( 'change', this.render, this );
		},
		render: function() {
			var size = this.model.get( 'size' );
			var unit = [ 'Bytes', 'KB', 'MB', 'GB' ];
			var uIndex = 1;
			while ( size > 1024 && uIndex < unit.length ) {
				size = size / 1024;
				uIndex++;
			}

			this.$el.find( '.size span' ).html( Math.round( size ) + ' ' + unit[uIndex-1] );

			return this;
		}
	} );
} ) ();
