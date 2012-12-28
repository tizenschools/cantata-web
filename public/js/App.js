( function() {

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
		addHandler: function( event, handler ) {
			handlers = this.events[ event ];
			if ( !handlers ) {
				handlers = this.events[ event ] = [];
			}

			handlers.push( handler );
		},
		handle: function( event, args ) {
			debug( 'Event: ' + event );
			debug( 'Args: ' + args );

			handlers = this.events[ event ];
			if ( handlers ) {
				_.each( handlers, function( handler ) {
					handler( args );
				}, this );
			}
		}
	} );

	AppView = View.extend( {
		initialize: function() {
			var icons = new Icons();
			icons.add( new Icon( { name:'Contacts', image: 'img/contacts.png', command: new OpenContacts( { target: this.el } ) } ) );
			icons.add( new Icon( { name:'Test', image: 'img/contacts.png', command: new OpenContacts( { target: this.el } ) } ) );
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
			return this.model.get( 'title' );
		},
		render: function() {
			$.window.prepare( {
				dock: 'bottom',
				animationSpeed: 500,
				minWinLong: 180
			} );
			this.wnd = this.$el.window( {
				title: this.getTitle(),
				modalOpacity: 0.5,
				content: this.createContents(),
				footerContent: this.createFooter(),
				checkBoundary: true,
				resizable: true
			} );
			info( 'Window: ' + this.wnd );
			return this;
		},
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

	OpenContacts = Command.extend( {
		execute: function() {
			var categories = new Categories();
			var categoriesView = new CategoriesView( { el: this.get( 'target' ), collection: categories } );
			categoriesView.render();
		}
	} );


} ) ();
