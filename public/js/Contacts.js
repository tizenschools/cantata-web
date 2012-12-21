( function() {
	Contact = Model.extend( {} );
	Category = Model.extend( {
		initialize: function( options ) {
			this.set( 'name', options.name );
			this.set( 'contacts', new Collection( _.map( options.contacts, function( contact ) {
				return new Contact( contact );
			} ) ) );
		},
	} );
	Categories = Collection.extend( {
		model: Category,
		url: function() {
			return '/contacts'
		},
		parse: function( res ) {
			debug( 'Parse: ' + res );
			ret = [];
			_.each( res, function( category ) {
				debug( 'Category :' + category );
				for ( prop in category ) {
					var c = {};
					c['name'] = prop;
					c['contacts'] = category[prop];

					debug( category[prop] );
					
					ret.push( c );
				}
			} );
			return _.map( ret, function( category ) {
				c = new Category( category );
				return c;
			} );
		},
	} );


	ContactView = View.extend( {
		tagName: 'li',
		render: function() {
			this.$el.html( this.model.get( 'name' ) );
			return this;
		}
	} );

	ContactsView = View.extend( {
		initialize: function() {
			this.contents = $( '<ul></ul>' );
			this.$el.append( this.contents );
		},
		render: function() {
			this.collection.each( function( contact ) {
				this.contents.append( new ContactView( { model: contact } ).render().el );
			}, this );

			return this;
		}

	} );

	CategoryView = View.extend( {
		initialize: function() {},
		render: function() {
			var name = this.model.get( 'name' );
			debug( 'Category: ' + name );
			this.name = $( '<h3></h3>' );
			this.name.text( name );
			this.$el.append( this.name );
			this.contacts = new ContactsView( { collection: this.model.get( 'contacts' ) } ).render();
			this.$el.append( this.contacts.el );
			return this;
		}

	} );

	CategoriesView = WindowView.extend( {
		initialize: function() {
			_.bindAll( this );
			this.collection.bind( 'reset', this.resetCategory, this );
			this.collection.bind( 'add', this.addCategory, this );
			this.collection.fetch();
		},
		getTitle: function() {
			return 'Contacts';
		},
		createContents: function() {
			this.contents = $( '<div id="contacts"></div>' );
			this.resetCategory();
			return this.contents;
		},
		createFooter: function() {
			debug( 'Create footer' );
			this.footer = $( '<div id="footer"></div>' );
			this.footer.append( new Button( {
				name: '+',
				model: new Command( {
					execute: function() {

						$.post( '/categories', function( data ) {
						} );
					}
				} )
		   	} ).render().el );
			return this.footer;
		},

		resetCategory: function() {
			debug( 'Reset' );
			this.collection.each( function( category ) {
				debug( 'Append' );
				this.addCategory( category );
			}, this );
			if ( this.wnd ) {
				this.wnd.setContent( this.contents );
				this.wnd.getFrame().find( '#contacts' ).accordion();
			}
		},
		addCategory: function( category, index ) {
			debug( 'Added' );
			debug( 'con :' + this.contents.html() );
			new CategoryView( { model: category, el: $( this.contents ) } ).render();
			debug( 'con :' + this.contents.html() );

		},
	} );


} ) ();
