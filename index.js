const { createReadStream } = require( "fs" );
const micro = require( "micro" );
const Router = require( "micro-http-router" );
const LRU = require( "quick-lru" );
const RingBuffer = require( "ring-buffer" );
const hackernews = require( "./hackernews" );

const MAX_STORIES = 10000;

const storyCache = new LRU( { maxSize: MAX_STORIES } );
const storyIDBuffer = new RingBuffer( MAX_STORIES );
const storyIDs = new Set();

const databaseRef = hackernews.database().ref( "v0" );
const itemRef = databaseRef.child( "item" );

databaseRef.child( "topstories" ).on( "value", snapshot => {
	let newStoryIDs = snapshot.val();
	
	for( let i = newStoryIDs.length - 1; i >= 0; i-- ) {
		const storyID = newStoryIDs[ i ];
		
		if( storyIDs.has( storyID ) ) {
			continue;
		}
		
		if( storyIDs.length === storyIDBuffer.size ) {
			storyIDs.delete( storyIDBuffer.removeLast() );
		}
		
		storyIDs.add( storyID );
		storyIDBuffer.addFirst( storyID );
		
		itemRef.child( storyID ).once( "value", snapshot => {
			storyCache.set( storyID, trimStory( snapshot.val() ) );
		} );
	}
} );

function trimStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	return { id, title, url, descendants };
}

const STORIES_PER_PAGE = 30;

function getPage( pageIndex ) {
	const startIndex = pageIndex * STORIES_PER_PAGE;
	const stories = [];
	
	for( const storyID of storyIDBuffer.slice( startIndex, startIndex + STORIES_PER_PAGE ) ) {
		const story = storyCache.get( storyID );
		if( story !== undefined ) {
			stories.push( story );
		}
	}
	
	return stories;
}

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