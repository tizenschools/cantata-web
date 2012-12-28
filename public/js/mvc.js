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

	trace = Logger.trace;
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
		template: function( model, template ) {
			var temp = template;
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
				info( "No model: {0}", temp );
				return temp;
			}

			var result = Mustache.render( temp, model.toJSON() );
			info( "Create template :{0}", result );
			return result;
		},

		render: function() {
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

	Command = Model.extend( {
		initialize: function() {
			if ( !this.execute ) {
				this.execute = this.get( 'execute' );
			}
		}
		// -execute
	} );

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
			trace( 'onClick' );
			if ( this.model && this.model.execute ) {
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

	DialogView = View.extend( {

		headerTemplate:
		'<div class="modal-header">' +
			'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
			'<h3>Dialog</h3>' +
		'</div>',

		bodyTemplate:
		'<div class="modal-body">' +
		'</div>',

		footerTemplate:
		'<div class="modal-footer">' +
		'</div>',

		className: 'modal hide fade',

		initialize: function( options ) {
			that = this;
			this.buttons = {};
			this.header = this.createHeader();
			this.body = this.createBody();
			this.footer = this.createFooter();
		},

		render: function() {
			this.$el.append( this.header );
			this.$el.append( this.body );
			this.$el.append( this.footer );

			that = this;
			this.$el.modal( {
				backdrop: 'static',
				keyboard: false
			} ).on( 'hidden', function() {
				that.close();
			} );
		},

		createHeader: function() {
			var ret = $( this.template( this.model, this.headerTemplate ) );
			ret.find( 'h3' ).text( this.title );
			return ret;
		},

		createBody: function() {
			var body = $( this.template( this.model, this.bodyTemplate ) );
			body.append( this.createContents() );
			return body;
		},

		createFooter: function() {
			var footer = $( this.template( this.model, this.footerTemplate ) );


			this.addButtons( footer );

			return footer;
		},

		addButtons: function( footer ) {
			var cancel = $( '<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>' );
			this.addButton( 'cancel', cancel );
			footer.append( cancel );

			var ok = $( '<button class="btn btn-primary">OK</button>' );
			footer.append( ok );
			this.addButton( 'ok', ok, this.done );


		},

		open: function( callbaack ) {
			this.render();
			this.callback = callbaack;
			this.$el.modal( 'show' );
		},

		addButton: function( name, btn, handler ) {
			if ( handler ) {
				btn.click( _.bind( handler, this ) );
			}
			this.buttons[name] = { button: btn, handler: handler };
		},

		done: function() {
			if ( that.model && that.model.execute ) {
				that.model.execute();
			}

			that.close();
		},

		close: function() {
			this.$el.modal( 'hide' );
			this.remove();
		},
	} );


	QuestionDialogView = DialogView.extend( {
		title: 'Question',
		createContents: function() {
			return this.model.get( 'message' );
		},
		addButtons: function( footer ) {
			var no = $( '<button class="btn" data-dismiss="modal" aria-hidden="true">No</button>' );
			this.addButton( 'no', no );
			footer.append( no );

			var no = $( '<button class="btn btn-primary">Yes</button>' );
			footer.append( no );
			this.addButton( 'yes', no, this.done );

		},
	} );

} ) ();

