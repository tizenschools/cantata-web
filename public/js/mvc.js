( function() {
	Logger = {
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
			message = "[TRACE] " + Logger.format.apply( Logger, arguments );
			Logger.log.apply( Logger, [ message ] );
		},
		debug: function() {
			message = "[DEBUG] " + Logger.format.apply( Logger, arguments );
			Logger.log.apply( Logger, [ message ] );
		},
		info: function() {
			message = "[INFO ] " + Logger.format.apply( Logger, arguments );
			Logger.log.apply( Logger, [ message ] );
		},
		warn: function() {
			message = "[WARN ] " + Logger.format.apply( Logger, arguments );
			Logger.log.apply( Logger, [ message ] );
		},
		error: function() {
			message = "[INFO ] " + Logger.format.apply( Logger, arguments );
			Logger.log.apply( Logger, [ message ] );
		},
		dummy: function() {
		}
	};

	trace = Logger.dummy;
	debug = Logger.dummy;
	info = Logger.dummy;
	warn = Logger.dummy;
	error = Logger.dummy;

	//trace = Logger.trace;
	debug = Logger.debug;
	info = Logger.info;
	warn = Logger.warn;
	error = Logger.error;

	Model = Backbone.Model.extend( {
	} );
	View = Backbone.View.extend( {
		initialize: function( options ) {
			if ( options && options.defaultTemplate ) {
				debug( "Default template changed: " + options.defaultTemplate );
				this.defaultTemplate = options.defaultTemplate;
			}
			this.$el.html( this.template( this.model ) );
		},
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
			info( "Create template :{0}", result );
			return result;
		},

		render: function() {
			this.$el.html( this.template( this.model ) );
			return this;
		},

		addView: function( view, index, target ) {
			target || (target = this.$el);
			if ( 0 <= index ) {
				debug( 'Append ' + index + ' th' );
				var element = view.el;
				var elName = element.tagName;

				var selection = this.$( elName + ':nth-child(' + index + ')' );
				if ( 0 < selection.length ) {
					selection.after( element );
				} else {
					target.append( view.el );
				}
			} else {
				debug( 'Append last' );
				target.append( view.el );
			}
		},
	} );
	Collection = Backbone.Collection.extend( { } );

	Button = View.extend( {
		tagName: 'a',
		className: 'btn',
		events: { 'click': 'onClick' },
		initialize: function( options ) {
			this.name = options.name;
			this.render();
		},
		render: function() {
			this.$el.text( this.name );
			return this;
		},
		onClick: function() {
			if ( this.model && this.model.canExecute && this.model.canExecute() ) {
				this.model.execute();
			}
		}
	} );

	CreateButton = Button.extend( {
		defaultTemplate: '<i class="icon-plus"></i>',
		onClick: function() {
			this.collection.add( [{}] );
		}
	} );

	SelectionChangeListener = {
		selectionChanged: function( selection ) {
		}
	};

} ) ();

