const SlimClient = require( "./slim-client.js" );

class JSONClient extends SlimClient {
	process( data, resolve, reject ) {
		let obj;
		try {
			obj = JSON.parse( data );
		}
		catch( error ) {
			reject( `Expected JSON but found \"${data}\"` );
			return;
		}
		resolve( obj );
	}
}

module.exports = JSONClient;