exports.Contacts = {
	list: function() {
		return exports.Contacts.model;
	},
	addCategory: function( category ) {
		exports.Contacts.model[category] = [];
	},
	removeCategory: function( category ) {
		delete exports.Contacts.model[category];
	}
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

