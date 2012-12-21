( function() {
	escode = {};
	escode.coders = {};
	escode.coders.Logger = {
		format: function( text ) {
			// check if there are two arguments in the arguments list
			if ( arguments.length <= 1 ) {
				//if there are not 2 or more arguments there's nothing to replace
				//just return the original text
				return text;
			}
			//decrement to move to the second argument in the array
			var tokenCount = arguments.length - 2;
			for( var token = 0; token <= tokenCount; token++ ) {
				//iterate through the tokens and replace their placeholders from the original text in order
				text = text.replace( new RegExp( "\\{" + token + "\\}", "gi" ), arguments[ token + 1 ] );
			}
			return text;
		},
		log: function( message ) {
			console.log( message );
		},
		trace: function() {
			message = "[TRACE] " + escode.coders.Logger.format.apply( escode.coders.Logger, arguments );
			escode.coders.Logger.log.apply( escode.coders.Logger, [ message ] );
		},
		debug: function() {
			message = "[DEBUG] " + escode.coders.Logger.format.apply( escode.coders.Logger, arguments );
			escode.coders.Logger.log.apply( escode.coders.Logger, [ message ] );
		},
		info: function() {
			message = "[INFO ] " + escode.coders.Logger.format.apply( escode.coders.Logger, arguments );
			escode.coders.Logger.log.apply( escode.coders.Logger, [ message ] );
		},
		error: function() {
			message = "[INFO ] " + escode.coders.Logger.format.apply( escode.coders.Logger, arguments );
			escode.coders.Logger.log.apply( escode.coders.Logger, [ message ] );
		}
	};

	trace = escode.coders.Logger.trace;
	debug = escode.coders.Logger.debug;
	info = escode.coders.Logger.info;
	error = escode.coders.Logger.error;

	Model = escode.coders.Model = Backbone.Model.extend( {
	} );
	View = escode.coders.View = Backbone.View.extend( {
		template: function( model ) {
			var temp = this.defaultTemplate;
			if ( this.templateId ) {
				temp = $( this.templateId ).html();
				if ( !temp ) {
					temp = this.defaultTemplate;
				}
			}

			if ( !temp ) {
				return "";
			}
			if ( !model ) {
				info( "No model" );
				return temp;
			}

			var result = Mustache.render( temp, model.toJSON() );
			info( "[DEBUG] Create template :{0}", result );
			return result;
		},

		render: function() {
			this.$el.html( this.template( this.model ) );
			return this;
		},

	} );
	Collection = escode.coders.Collection = Backbone.Collection.extend( { } );


	Page = Model.extend( {
		initialize: function() {
			this.loaded = false;
		},
		parse: function( contents ) {
			info( "[ INFO] contents :{0}", contents );
			this.loaded = true;
			this.set( "contents", contents );
		}
	} );

	PageThumbnailView = View.extend( {
		tagName: "a",
		defaultTemplate: "<div class='page-thumbnail'></div>",
		events: {
			"click": "onClick"
		},
		initialize: function() {
			this.navigator = this.options.navigator;
			this.model.bind( "change", this.changeState, this );
		},
		onClick: function() {
			info( "User click thumbnail" );
			this.navigator.select( this.model );
		},
		changeState: function() {
			if ( this.model.get( "selection" ) ) {
				this.$( "div" ).addClass( "selected" );
			} else {
				this.$( "div" ).removeClass( "selected" );
			}
		},
	} );

	PageView = View.extend( {
		className: "step page",
		defaultTemplate: "{{contents}}",
		initialize: function() {
			_.bindAll( this );
			info( "Page( {0}, {1} ) added", this.options.x, this.options.y );
			$( this.el ).attr( "data-x", this.options.x || 0 );
			$( this.el ).attr( "data-y", this.options.y || 0 );
			$( this.el ).html( this.model.get( "contents" ) );
			$( this.el ).on( "enterStep", this.enterPage );
		},
		render: function() {
			return this;
		},
		enterPage: function( e ) {
			this.model.slide.changePage( this.model );
		},
	} );


	Pages = Collection.extend( {
		model: Page,
	} );

	Slide = Model.extend( {
		initialize: function() {
			this.cover = new Page();
			this.cover.slide = this;
			this.pages = new Pages();
			_.bindAll( this );
			this.cover.bind( "change", this.update );
		},

		url: function() {
			return this.get( "url" );
		},

		parse: function( res ) {
			info( "Slide loaded" );
			that = this;
			this.pages.reset();

			this.cover.url = res.cover;
			this.cover.fetch( { dataType: "text" } );

			iPage = 1;
			_.each( res.pages, function( name ) {
				info( "Create " + name );
				page = new Page();
				page.url = name;

				page.fetch( {
					dataType: "text"
				} );
				page.slide = that;
				page.bind( "change", that.update );
				this.pages.add( page );
			}, this );

			delete res.pages;

			return res;
		},

		update: function() {
			if ( !this.cover.loaded ) {
				info( "Cover not loaded" );
				return ;
			}

			if ( this.pages.find( function( test ) {
				return !test.loaded;
			} ) ) {
				info( "Page not loaded" );
				return ;
			}
			this.trigger( "change" );
		},
		changePage: function( page ) {
			index = this.pages.indexOf( page );
			if ( index < 0 ) {
				document.title = this.get( "name" );
			} else {
				document.title = page.url + "(" + (index+1) + "/" + this.pages.length + ")"
			}
		}
	} );


	SlideView = View.extend( {
		initialize: function() {
			info( "SlideView init" );
			_.bindAll( this );
			$( document ).bind('keydown', this.onKeyDown );
			$( document ).bind('keyup', this.onKeyUp );
			this.model.bind( "change", this.render, this );
			this.model.fetch( { silent: true } );
		},

		addPage: function( pageView ) {
			$( this.el ).append( pageView.render().el );
		},

		render: function() {
			info( "Render :{0}", this.model.get( "name" ) );
			if ( this.model.get( "name" ) ) {
				document.title = this.model.get( "name" );
			}

			this.addPage( new PageView( { model: this.model.cover } ) );
			i = 1;
			this.model.pages.each( function( page ) {
				this.addPage( new PageView( { model: page, x: 1000*i } ) );
				i++;
			}, this );
			$( this.el ).jmpress();

			return this;
		},
		onKeyDown: function( e ) {
			if ( e.keyCode == 17 ) {
				this.enableEffect();
			} else {
				info( "{0} down", e.keyCode );
			}
		},

		onKeyUp: function( e ) {
			if ( e.keyCode == 17 ) {
				this.disableEffect();
			} else {
				info( "{0} up", e.keyCode );
			}
		},

		enableEffect: function() {
			if ( this.effect ) {
				return ;
			}
			$( this.el ).css( 'background-color: rgba( 0, 0, 0, 0.7 );position:fixed;' );

			trace( "effect on" );
			this.effect = true;
		},

		disableEffect: function() {
			if ( !this.effect ) {
				return ;
			}
			this.effect = false;
		}
	} );

	PageNavigator = Model.extend( {
		initialize: function() {
			this.slide = this.get( "slide" );
		},

		addNewPageAfter: function( before ) {
			page = new Page();
			if ( before ) {
			} else {
				this.slide.pages.add( page );
				trace( "New page added at last" );
			}
			this.select( page );
		},
		select: function( page ) {
			old = this.get( "selected" );
			if ( old ) {
				old.set( "selection", false );
			}
			if ( page ) {
				page.set( "selection", true );
			}
			this.set( "selected", page );
		}
	} );

	PageNavigatorView = View.extend( {
		templateId: "#navigator-template",
		events:{
			"click #add": "addNewPage"
		},
		
		initialize: function() {
			this.model.slide.pages.bind( "add", this.addThumbnailView, this );
		},

		addThumbnailView: function( newPage ) {
			trace( "Add ThumbnailView : {0}", newPage );
			thumbnailView = new PageThumbnailView( { model: newPage, navigator: this.model } ).render();
			this.$( "#pages" ).append( thumbnailView.el );
		},
		selectionChanged: function( newThumbnail ) {
			if ( this.selectedThumbnail ) {
				this.selectedThumbnail.deselect();
			}
			if ( newThumbnail ) {
				newThumbnail.select();
			}

			this.selectedThumbnail = newThumbnail;
		},

		addNewPage: function() {
			info( "User request New Page" );
			this.model.addNewPageAfter( this.selection );
		},
		select: function() {
		}
	} );




	PageEditor = Model.extend( {

	} );

	PageEditorView = View.extend( {
		templateId: "#editor-template",
		events: {
			"click #add-text": "addText",
			"click #add-image": "addImage",
		},

		initialize: function() {
			this.model.bind( "change", this.render, this );
		},

		addText: function() {
			info( "Click add-text" );
			text = new Text( { x:100, y:100 } );
			textView = new TextView( { model: text } );

			this.$( "#page" ).append( textView.render().el );
		},

		addImage: function() {
			info( "Click add-image" );
		}
	} );

	Component = Model.extend( {
		name: "Component"
	} );

	Text = Component.extend( {
		name: "Text"
	} );

	Image = Component.extend( {
		name: "Image"
	} );

	ComponentView = View.extend(  {
		events: {
			"dblclick": "onDoubleClick"
		},
		initialize: function() {
		},
		render: function() {
			this.$el.html( this.template( this.model ) );
			this.$( ".container" ).click( this.onClick, this );
			x = this.model.get( "x" );
			y = this.model.get( "y" );

			debug( "Show component at ( {0}, {1} )", x, y );
			this.$el.css( "position", "relative" );
			this.$el.css( "top", y );
			this.$el.css( "left", x );
			
			return this;
		},
		onClick: function() {
			info( "User click {0}", this.model.name );
		},
		onDoubleClick: function() {
			info( "User double-click {0}", this.model.name );
		}
	} );

	TextView = ComponentView.extend( {
		className: "component",
		templateId: "#text-template"
	} );


	ImageView = ComponentView.extend( {
		templateId: "#image-template"
	} );
} ) ();

