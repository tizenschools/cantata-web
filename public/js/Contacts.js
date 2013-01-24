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
		initialize: function() {
			_.bindAll( this );
			app.on( 'categoryAdded', this.addCategory );
		},
		url: function() {
			return '/contacts'
		},
		parse: function( res ) {
			debug( 'Parse: ' + res );
			ret = [];
			debug( 'Category :' + res );
			for ( prop in res ) {
				var c = {};
				c['name'] = prop;
				c['contacts'] = res[prop];

				debug( res[prop] );
				
				ret.push( c );
			}
			return _.sortBy( _.map( ret, function( category ) {
				c = new Category( category );
				return c;
			} ), this.comparator );
		},
		comparator: function( m ) {
			return m.get( 'name' );
		},
		addCategory: function( args ) {
			info( '<<< Category added: {0}', JSON.stringify( args ) );
			_.each( args, function( name ) {
				var category = new Category( { 'name': name } );
				var index = this.sortedIndex( category, this.comparator );
				debug( 'Index: {0}', index );
				this.add( category, { at: index } );
			}, this );
			info( 'Categories: {0}', JSON.stringify( this ) );
		}
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
		tagName: 'h3',
		initialize: function() {},
		render: function() {
			var name = this.model.get( 'name' );
			debug( 'Category: ' + name );
			this.$el.text( name );
			this.$el.append( this.name );
			return this;
		}

	} );

	CategoriesView = WindowView.extend( {
		initialize: function() {
			this.categoryViews = [];
			this.contactsViews = [];
			_.bindAll( this );
			this.collection.bind( 'reset', this.resetCategory, this );
			this.collection.bind( 'add', this.addCategory, this );
			this.collection.fetch();
		},
		getTitle: function() {
			return 'Contacts';
		},
		createContents: function() {
			this.resetCategory();
		},
		createFooter: function() {
			debug( 'Create footer' );
			this.footer = $( '<div id="footer"></div>' );
			var addBtn = new Button( {
				name: '+',
				model: new Command( {
					execute: function() {
						dialog = new NewCategoryDialogView( { model: new AddNewCategory() } );
						dialog.open();
					}
				} )
		   	} ).render();

			var removeBtn = new Button( {
				name: 'X',
				model: new Command( {
					execute: function() {
						dialog = new QuestionDialogView( { model: new RemoveCategory() } );
						dialog.open();
					}
				} )
		   	} ).render();
			this.footer.append( addBtn.el );
			this.footer.append( removeBtn.el );
			return this.footer;
		},

		resetCategory: function() {
			debug( 'Reset' );
			this.collection.each( function( category ) {
				this.addCategory( category );
			}, this );
		},
		addCategory: function( category, collection, options ) {
			debug( 'Options: ' + JSON.stringify( options ) );
			var categoryView =  new CategoryView( { model: category } ).render().$el;
			var contactsView =  new ContactsView( { collection: category.get( 'contacts' ) } ).render().$el;
			if ( options && 0 <= options.index ) {
				if ( options.index < this.categoryViews.length ) {
					this.categoryViews[options.index].before( categoryView );
					categoryView.after( contactsView );
				} else {
					this.$body.append( categoryView );
					this.$body.append( contactsView );
				}
				this.categoryViews.splice( options.index, 0, categoryView );
				this.contactsViews.splice( options.index, 0, contactsView );
			} else {
				this.$body.append( categoryView );
				this.$body.append( contactsView );
				this.categoryViews.push( categoryView );
				this.contactsViews.push( contactsView );
			}
		},
	} );

	AddNewCategory = Command.extend( {
		execute: function() {
			$.ajax( {
				type: 'POST',
				url: '/categories',
				data: { 'name': this.get( 'name' ) }
			} );

			console.log( '>> Add new category' );
		}
	} );
	RemoveCategory = Command.extend( {
		defaults: {
			'message': 'Do you confirm to remove? ( This can\'t be recovered )'
		},
		execute: function() {
			debug( '>> Remove category[{0}]', this.get( 'name' ) );
		}
	} );

	NewCategoryDialogView = DialogView.extend( {
		title: 'New Category',

		contentsTemplate:
		'<form class="form-horizontal">' +
			'<fieldset>' +
				'<div class="control-group">' +
					'<label class="control-label" for="input01">Name</label>' +
					'<div class="controls">' +
						'<input placeholder="Input category name" class="input-xlarge" type="text">' +
						'<p class="help-block"></p>' +
					'</div>' +
				'</div>' +
			'</fieldset>' +
		'</form>',

		done: function() {
			this.model.set( 'name', this.$( 'input' ).val() );
			DialogView.prototype.done.call( this );
		},

		onKeypress: function( e ) {
			if ( 13 != e.keyCode ) {
				return ;
			}
			
			this.done();
			return false;
		},

		createContents: function() {
			return this.template( this.model, this.contentsTemplate );
		}

	} );



} ) ();
