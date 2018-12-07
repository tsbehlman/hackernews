const https = require( "https" );

function streamToString( response, resolve, reject ) {
	let string = "";
	response.on( "data", ( data ) => {
		string += data.toString();
	} );
	response.on( "end", function() {
		resolve( string );
	} );
	response.on( "error", reject );
}

class SlimClient {
	constructor( defaults ) {
		if( defaults.path === undefined ) {
			defaules.path = "";
		}
		this.defaults = defaults;
	}
	
	get( path ) {
		const options = {
			...this.defaults,
			path: this.defaults.path + path
		};
		return new Promise( ( resolve, reject ) => {
			https.get( options, ( response ) => {
				if( response.statusCode >= 200 && response.statusCode < 300 ) {
					streamToString( response, string => this.process( string, resolve, reject ), reject );
				}
				else {
					reject( `${this.defaults.host} responded with ${response.statusCode}:${response.statusMessage}` );
				}
			} );
		} );
	}
	
	process( data, resolve, reject ) {
		resolve( data );
	}
}

module.exports = SlimClient;