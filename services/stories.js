const LRU = require( "quick-lru" );
const hackernews = require( "./hackernews" );

const storyCache = new LRU( { maxSize: 10000 } );
const itemRef = hackernews.child( "item" );

function trimStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	return { id, title, url, descendants };
}

module.exports = Promise.resolve( async function( storyID ) {
	let story = storyCache.get( storyID );
	
	if( story === undefined ) {
		const snapshot = await itemRef.child( storyID ).once( "value" );
		story = trimStory( snapshot.val() );
		storyCache.set( storyID, story );
	}
	
	return story;
} );