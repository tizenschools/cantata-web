
exports.model.contacts = [ {
	'Friedns': [{
		"name":"A",
		"phoneNumber":["000-0000-0001","000-0000-0002"]
	}],
	'Family': [{
		"name":"c",
		"phoneNumber":["000-0000-0004"]
	}]
}];

exports.index = function( req, res ) {
	res.render('index', { title: 'Express' });
};

exports.contacts = function( req, res ) {
	res.send( JSON.stringify( this.model.json, null, '\t' ) );
}

exports.category.add = function( req, res ) {
	var newCategory = JSON.parse( req.contents );
	for ( prop in newCategory ) {
		exports.model.contacts[prop] = newCategory[prop];
	}
}
