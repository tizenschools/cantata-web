var _ = require( 'underscore' );
var osp = require( './tizen-native.node' );

exports.model = {};

exports.model.contacts = [ {
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
} ];

exports.index = function( req, res ) {
	res.send( 'index', { title: 'Express' });
};

exports.contacts = function( req, res ) {
    contacts = new osp.Contacts();
    console.log( JSON.stringify( contacts.list() ) );     
	res.send( JSON.stringify( contacts.list() ) );     
	/*res.send( JSON.stringify( exports.model.contacts, null, '\t' ) );*/
};

exports.category = function() {
};
exports.category.add = function( req, res ) {
	var newCategory = JSON.parse( req.contents );
	for ( prop in newCategory ) {
		exports.model.contacts[prop] = newCategory[prop];
	}
};
