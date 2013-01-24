endsWith = function( str, checker ) {
	if ( str != null && checker != null && str.length >= checker.length ) {
		if( str.substr( str.length - checker.length ) == checker ) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

startsWith = function( str, checker ) {
	if ( str != null && checker != null && str.length >= checker.length ) {
		if ( str.substr( 0, checker.length ) == checker ) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

addPath = function ( path1, path2 ) {
	if ( endsWith( path1, '/' ) ) {
		return addPath( path1.substr( 0, path1.length - 1 ), path2 );
	} else if ( startsWith( path2, '/' ) ) {
		return addPath( path1, path2.substr( 1 ) );
	} else {
		return path1 + '/' + path2;
	}
}

getFilenameFrom = function( path ) {
	var index = path.lastIndexOf( '/' );
	if ( index < 0 ) {
		return path;
	}

	return path.substr( index + 1 );
}

getParentFrom = function( path ) {
	var index = path.lastIndexOf( '/' );
	if ( index <= 0 ) {
		return '/';
	}

	return path.substr( 0, index );
}

