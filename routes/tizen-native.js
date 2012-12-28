exports.Contacts = function() {

	return {
		list: function() {
			return exports.Contacts.model;
		},
		add: function( category ) {
			exports.Contacts.model[category] = [];
		}
	};
};

	exports.Contacts.model = {
		'Friedns': [ {
			"name":"A",
			"phoneNumber": [ "000-0000-0001","000-0000-0002" ]
		}, {
			"name": "B",
			"phoneNumber": [ "000-0000-0003" ]
		} ],
		'Family': [ {
			"name":"c",
			"phoneNumber" : [ "000-0000-0004" ]
		} ]
	};

