( function() {

	Contact = Model.extend( {} );

	Category = Model.extend( {
		initialize: function( options ) {
			_.bindAll( this );
			app.on( 'categoryRemoved', this.removeCategory );
			this.set( 'name', options.name );
			this.set( 'contacts', new Collection( _.map( options.contacts, function( contact ) {
				return new Contact( contact );
			} ) ) );
		},
		removeCategory: function( args ) {
			var name = args.categories;
			var force = args.force;

			if ( this.get( 'name' ) === name ) {
				info( '<<< Category removed: {0}', JSON.stringify( args ) );
				this.destroy();
			}
		},
	} );

	Categories = Collection.extend( {
		model: Category,
		initialize: function() {
			_.bindAll( this );
			app.on( 'categoryAdded', this.addCategory );
			app.on( 'categoryChanged', this.renameCategory );
			// this.bind( 'remove', this.removeCategory );
		},
		// removeCategory: function() {
		// 	info( '<<< Category removed in Collection, collection reset' );
		// 	this.reset();
		// },
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
		},
		renameCategory: function( args ) {
			info( '<<< Category renamed: {0}', JSON.stringify( args ) );
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
			this.collection.bind( 'remove', this.removeCategory, this );
			this.collection.fetch();
		},
		getCollecion: function() {
			return this.collection;
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

		   	var that = this;

			var removeBtn = new Button( {
				name: 'X',
				model: new Command( {
					execute: function() {
						dialog = new RemoveCategoryDialogView( { model: new RemoveCategory( { categories: that.collection } ) } );
						dialog.open();
					}
				} )
		   	} ).render();

			var renameBtn = new Button( {
				name: 'R',
				model: new Command( {
					execute: function() {
						dialog = new RenameCategoryDialogView( { model: new RenameCategory() } );
						dialog.open();
					}
				} )
		   	} ).render();

			this.footer.append( addBtn.el );
			this.footer.append( removeBtn.el );
			this.footer.append( renameBtn.el );
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
		removeCategory: function( category, collection, options ) {
			debug( 'Options: ' + JSON.stringify( options ) );
		}
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
			var names = this.get( 'names' );
			_.each( names, function( name ){
				$.ajax( {
					type: 'DELETE',
					url: '/categories/' + name,
					data: { 'force': true }
				} );
				debug( '>> Remove category[{0}]', name );
			} );
		}
	} );

	RenameCategory = Command.extend( {
		defaults: {
			'message': 'Do you confirm to rename? ( This can\'t be recovered )'
		},
		execute: function() {
			debug( '>> Rename category[{0}]', this.get( 'name' ) );
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

		getTitle: function() {
			return this.title;
		},

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

	RemoveCategoryDialogView = DialogView.extend( {
		title: 'Remove Category',

		contentsTemplate:
		'<p><input type="checkbox" name={{name}}>{{name}}</input></p>',

		getTitle: function() {
			return this.title;
		},

		done: function() {
			var names = [];
			$("input:checkbox:checked").each( function() {
				names.push ( this.name );
			} );
			this.model.set( 'names', names );
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
			console.log( 'RemoveCategoryDialogView create :' + this.model.get( 'categories' ) );

			this.$form = $('<form></form>');
			var that = this;

			this.model.get( 'categories' ).each( function( category ) { 
				var name = category.get('name');
				console.log( "Current Category name : " + name );
				that.model.set( 'name', name );

				that.$form.append( that.template( that.model, that.contentsTemplate ) );
			} );
			return this.$form;
		}
	} );

	RenameCategoryDialogView = DialogView.extend( {
		title: 'Rename Category',

		getTitle: function() {
			return this.title;
		},

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
			//return this.template( this.model, this.contentsTemplate );
		}
	} );

} ) ();
