const URL = require( "url" );
const protocols = new Map( [
	[ "http", require( "http" ) ],
	[ "https", require( "https" ) ]
] );

function streamToString( response ) {
	return new Promise( function( resolve, reject ) {
		let string = "";
		response.on( "data", ( data ) => {
			string += data.toString();
		} );
		response.on( "end", function() {
			resolve( string );
		} );
		response.on( "error", reject );
	} );
}

function get( url ) {
	const options = URL.parse( url );
	const protocol = protocols.get( options.protocol.slice( 0, -1 ) );
	return new Promise( function( resolve, reject ) {
		const request = protocol.get( options, response => {
			if( response.statusCode >= 200 && response.statusCode < 400 ) {
				resolve( response );
			}
			else {
				reject( `${options.host} responded with ${response.statusCode}:${response.statusMessage}` );
			}
		} );
		request.setTimeout( 5000 );
		request.on( "error", reject );
	} );
}

const MAX_REDIRECTS = 5;

async function fetch( url ) {
	let incomingMessage;
	let redirects = 0;
	let lastURL = url;
	do {
		url = URL.resolve( lastURL, url );
		incomingMessage = await get( url );
		lastURL = url;
		url = incomingMessage.headers.location;
		redirects++;
	} while( url !== undefined && redirects <= MAX_REDIRECTS );
	return new Response( incomingMessage );
}

class Response {
	constructor( incomingMessage ) {
		this.incomingMessage = incomingMessage;
		this.headers = new Headers( incomingMessage.headers );
		this.status = incomingMessage.statusCode;
		this.ok = this.status >= 200 && this.status < 300;
	}
	
	async text() {
		return await streamToString( this.incomingMessage );
	}
	
	async json() {
		return JSON.parse( await this.text() );
	}
}

class Headers extends Map {
	constructor( headers ) {
		super( Object.entries( headers ) );
	}
	
	get( key ) {
		return super.get( key.toLowerCase() );
	}
}

module.exports = fetch;