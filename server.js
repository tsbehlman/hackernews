const { createReadStream } = require( "fs" );
const micro = require( "micro" );
const Router = require( "micro-http-router" );
const staticContentHandler = require( "serve-handler" );

const router = new Router();

let portNumber = parseInt( process.env.PORT );
if( isNaN( portNumber ) ) {
	portNumber = 8080;
}

const server = micro( async ( req, res ) => {
	try {
		return await router.handle( req, res );
	} catch( error ) {
		error.stack = `Error: ${req.method} ${req.url} ${error.statusCode} ${error.message}\n` + error.stack.split( "\n" ).slice( 1 ).join( "\n" );
		throw error;
	}
} );

( async function() {
	const [ getPage, getView, getThread ] = await Promise.all( [
		require( "./routes/page.js" ),
		require( "./routes/view.js" ),
		require( "./routes/thread.js" )
	] );
	
	const serveStaticContent = ( req, res ) => staticContentHandler( req, res, {
		public: "public",
		directoryListing: false,
		headers: [ {
			source: "**/*",
			headers: [ {
				key: "X-Robots-Tag",
				value: "noindex"
			} ]
		} ]
	} );
	
	function serveStaticWhen( tester, route ) {
		return function( req, res ) {
			if( tester( req.params ) ) {
				return serveStaticContent( req, res );
			}
			else {
				return route( req, res );
			}
		}
	}
	
	router.get( "/page/:index", ( req, res ) => getPage( parseInt( req.params.index ) - 1 ) );
	router.get( "/view/:id", serveStaticWhen( ( { id } ) => isNaN( id ), ( req, res ) => getView( res, parseInt( req.params.id ) ) ) );
	router.get( "/thread/:id", serveStaticWhen( ( { id } ) => isNaN( id ), ( req, res ) => getThread( res, parseInt( req.params.id ) ) ) );
	
	router.get( "/**", serveStaticContent );
	
	server.listen( portNumber );
	
	console.log( "ready to serve stories on port " + portNumber );
} )().catch( error => {
	throw error;
} );
