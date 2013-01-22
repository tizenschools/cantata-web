( function() {
	remove = function( arr, from, to ) {
		var rest = arr.slice( ( to || from ) + 1 || arr.length );
		arr.length = from < 0 ? arr.length + from : from;
		return arr.push.apply( arr, rest );
	};

	LoginDialogView = DialogView.extend( {
		// +createDialogArea
	} );

	App = Model.extend( {
		initialize: function() {
			that = this;
			var port = (location.port || location.host.split(':')[1] );
			if ( !port || port.length == 0 ) {
				portStr = '';
			} else {
				portStr = ':' + port;
			}
			url = 'http://' + ( location.host || 'localhost' ).split( ':' )[0] + portStr;
			debug( url );
			this.socket = io.connect( url );
			this.events = {};

			var emit = this.socket.$emit;
			this.socket.$emit = _.bind( this.handle, this );
		},
		handle: function( event, args ) {
			debug( 'Event: ' + event );
			debug( 'Args: ' + args );

			this.trigger( event, args );
			/*handlers = this.events[ event ];
			if ( handlers ) {
				info( handlers.length + ' handlers triggered' );
				_.each( handlers, function( handler ) {
					handler( args );
				}, this );
			}
			*/
		}
	} );

	AppView = View.extend( {
		initialize: function() {
			var icons = new Icons();
			icons.add( new Icon( { name:'System', image: 'img/contacts.png', command: new OpenSystem( { target: this.el } ) } ) );
			icons.add( new Icon( { name:'Contacts', image: 'img/contacts.png', command: new OpenContacts( { target: this.el } ) } ) );
			icons.add( new Icon( { name:'Messages', image: 'img/contacts.png', command: new OpenMessages( { target: this.el } ) } ) );
			icons.add( new Icon( { name:'File', image: 'img/contacts.png', command: new OpenFiles( { target: this.el } ) } ) );
			icons.add( new Icon( { name:'Photo', image: 'img/contacts.png', command: new OpenPhotos( { target: this.el } ) } ) );
			icons.add( new Icon( { name:'Music', image: 'img/contacts.png', command: new OpenMusics( { target: this.el } ) } ) );
			iconsView = new IconsView( { collection: icons } ).render();
			this.$el.append( iconsView.el );
			debug( 'doit' );
		},
	} );

	Window = Model.extend( {
		// -createContentsView
	} );
	WindowView = View.extend( {
		getTitle: function() {
			if ( this.model && this.model.get ) {
				return this.model.get( 'title' );
			}
			if ( this.title ) {
				return this.title;
			}
		},
		initialize: function() {
		},
		render: function() {
			$.window.prepare( {
				dock: 'bottom',
				animationSpeed: 500,
				minWinLong: 180
			} );
			this.wnd = this.$el.window( {
				title: this.getTitle(),
				modalOpacity: 0.6,
				content: $( '<div id="contents"></div>' ),
				footerContent: this.createFooter(),
				checkBoundary: true,
				width: this.width || 400,
				height: this.height || 500,
				resizable: true
			} );

			this.contents = this.wnd.getFrame().find( '#contents' );
			this.createContents();
			info( 'Window: ' + this.wnd );
			return this;
		},
		createFooter: function() {
			return '';
		},
		close: function() {
			this.wnd.close();
		}
	} );

	Icon = Model.extend( {
		// name
		// image
		// command
	} );

	Icons = Collection.extend( {
		model: Icon
	} );

	IconView = View.extend( {
		className: 'span1 icon',
		events: { 'click': 'onClick' },
		initialize: function( options ) {
			_.bindAll( this );
			this.img = $( '<img></img>' );
			this.name = $( '<div></div>' );
			this.$el.append( this.img );
			this.$el.append( this.name );
		},
		render: function( options ) {
			this.img.attr( 'src', this.model.get( 'image' ) );
			this.name.text( this.model.get( 'name' ) );
		},
		onClick: function() {
			trace( 'Click ' + this.model.get( 'name' ) );
			var command = this.model.get( 'command' );
			if ( command || command.execute ) {
				command.execute();
			} else {
				warn( 'No command: ' + command );
			}
		}

	} );

	IconsView = View.extend( {
		className: 'row show-grid',
		render: function() {
			var icons = this.collection;
			var that = this;
			icons.each( function( icon ) {
				iconView = new IconView( { model: icon } );
				iconView.render();
				that.$el.append( iconView.el );
			} );
			return this;
		}
	} );

	OpenSystem = Command.extend( {
		execute: function() {
            var storage = new SystemStorage();
            var systemInfoView = new SystemInfoView( { el: this.get( 'target' ), model: storage } );
            systemInfoView.render();
		}
	} );

	OpenContacts = Command.extend( {
		execute: function() {
			var categories = new Categories();
			var categoriesView = new CategoriesView( { el: this.get( 'target' ), collection: categories } );
			categoriesView.render();
		}
	} );

	OpenMessages = Command.extend( {
		execute: function() {
			var messages = new MessageSessions();
			var messagesView = new MessageSessionsView( { el: this.get( 'target' ), collection: messages } );
			messagesView.render();
		}
	} );

	OpenFiles = Command.extend( {
		execute: function() {
			var path = new File();
			var files = new Files( [], { parent: path } );
			var filesView = new FilesView( { el: this.get( 'target' ), model: path, collection: files } );
			filesView.render();
		}
	} );

	OpenPhotos = Command.extend( {
		execute: function() {
			var path = new File();
			var files = new Photos( [], { parent: path } );
			var filesView = new PhotosView( { el: this.get( 'target' ), model: path, collection: files } );
			filesView.render();
		}
	} );

	OpenMusics = Command.extend( {
		execute: function() {
			var dialogView = new MusicPlayerDialogView( { el: this.get( 'target' ), model: new Model() } );
			dialogView.render();
		}
	} );
} ) ();
