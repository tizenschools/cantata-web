( function() {

	Command = Model.extend( {
		// -execute
	} );

	DialogView = View.extend( {
		// +open
		// -createDialogArea
	} );
	LoginDialogView = DialogView.extend( {
		// +createDialogArea
	} );

	App = Model.extend( {
	} );
	AppView = View.extend( {

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
			this.wnd = $.window( {
				title: this.getTitle(),
				modalOpacity: 0.5,
				content: this.createContents(),
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
			if ( command && command.execute ) {
				command.execute();
			} else {
				warn( 'No command' );
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
			var categoriesView = new CategoriesView( { collection: categories } );
			categoriesView.render();
		}
	} );


} ) ();
