( function() {
	Message = Model.extend( {
	} );

	Messages = Collection.extend( {
		url: function() {
			return '/messages';
		}
	} );

	MessagesView = WindowView.extend( {
		getTitle: function() {
			return 'Messages';
		},
		initialize: function() {
			var that = this;
			_.bindAll( this );
			this.collection.fetch();
		},
		createContents: function() {
		},
	} );

} ) ();
