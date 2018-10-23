const { createReadStream } = require( "fs" );
const micro = require( "micro" );
const Router = require( "micro-http-router" );
const getPage = require( "./services/pages.js" );

const router = new Router();

function staticContent( path, mimeType ) {
	return ( req, res ) => {
		res.setHeader( "Content-type", mimeType );
		return createReadStream( path );
	};
}

router.get( "/", staticContent( "public/index.html", "text/html" ) );
router.get( "/stories.js", staticContent( "public/stories.js", "application/javascript" ) );
router.get( "/stories.css", staticContent( "public/stories.css", "text/css" ) );
router.get( "/favicon.ico", staticContent( "public/favicon.ico", "image/x-icon" ) );

router.get( "/page/:index", ( req, res ) => getPage( parseInt( req.params.index ) - 1 ) );

const portNumber = 8080;
micro( async ( req, res ) => {
	try {
		return await router.handle( req, res );
	} catch( error ) {
		error.stack = `Error: ${req.method} ${req.url} ${error.statusCode} ${error.message}\n` + error.stack.split( "\n" ).slice( 1 ).join( "\n" );
		throw error;
	}
} ).listen( portNumber );
console.log( "ready to serve stories on port " + portNumber );