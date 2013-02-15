( function() {
	Message = Model.extend( {
	} );

	MessageView = View.extend( {
		initialize: function( options )  {
			this.$box = $( '<div class="arrow_box"></div>' );
			var align = ( this.model.get( 'sender' ) )?'left':'right';
			this.$box.addClass( align + '_arrow_box' );

			this.$el.addClass( align + '_arrow_box_container' );
			this.$el.append( this.$box );
		},
		render: function( options )  {
			this.$box.text( this.model.get( 'text' ) );
			return this;
		}
	} );

	Messages = Collection.extend( {
		model: Message,
		url: function() {
			return addPath( '/messages', this.start );
		},
		parse: function( res ) {
			debug( JSON.stringify( res ) );
			return res;
		}
	} );

	MessageSession = Model.extend( {
		getMessages: function() {
			var messages = new Messages();
			messages.start = this.get( 'mid' );
			return messages;
		}
	} );

	MessageSessionView = View.extend( {
		templateId: '#message-session',
		events: {
			'dblclick': 'openMessage'
		},
		initialize: function() {
			this.$el.html( this.template( this.model ) );
		},
		openMessage: function() {
			trace( 'Open message list for {0}', this.model.get( 'mid' ) );

			new MessagesDialogView( { model: this.model } ).open();

		}
	} );

	MessageSessions = Collection.extend( {
		model: MessageSession,
		url: function() {
			return '/messages';
		},
		parse: function( res ) {
			return res;
		}
	} );
	MessageSessionsView = WindowView.extend( {
		getTitle: function() {
			return 'Messages';
		},
		initialize: function() {
			var that = this;
			_.bindAll( this );
			this.collection.bind( 'reset', this.resetSession, this );
			this.collection.bind( 'add', this.addSession, this );
			this.collection.fetch();
		},
		resetSession: function() {

			debug( 'Sessions reset' );
			this.$body.empty();
			this.collection.each( this.addSession, this );

		},
		addSession: function( session ) {
			trace( 'Session[{1}]: {0} added', session, session.get( 'path' ) );

			var view = new MessageSessionView( { model: session } ).render();
			this.$body.append( view.el );

		}
	} );


	MessagesDialogView = DialogView.extend( {
		getTitle: function() {
			return 'Messages with ' + this.model.get( 'name' );
		},
		initializeEvents: function() {
			this.collection = this.model.getMessages();
			this.collection.bind( 'reset', this.resetMessages, this );
			this.collection.bind( 'add', this.addMessage, this );
		},
		createContents: function() {
			this.collection.fetch();
			this.$start = $( '<div></div>' );
			return this.$start;
		},
		addButtons: function( footer ) {
			var $input = $( '<div class="input-append"></div>' );
			var $text = $( '<textarea class="input-xxlarge">' );
			var $send = $( '<button class="btn btn-primary">Send</button>' );
			$input.append( $text ).append( $send ).appendTo( footer );
			this.addButton( 'send', $send, function() {
				$.ajax( '/messages', {
					type: 'POST',
					data: { 
						receiver: this.model.get( 'sender' ) || this.model.get( 'receiver' ),
						text: $text.val()
					}
				} );
			} );

		},
		resetMessages: function() {
			this.collection.each( this.addMessage, this );
		},
		addMessage: function( message ) {
			this.$start.after( new MessageView( { model: message } ).render().el );
		},
	} );

} ) ();
