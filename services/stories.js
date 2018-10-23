const LRU = require( "quick-lru" );
const hackernews = require( "./hackernews" );

const storyCache = new LRU( { maxSize: 10000 } );
const itemRef = hackernews.child( "item" );

function trimStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	return { id, title, url, descendants };
}

async function getStory( storyID ) {
	let story = storyCache.get( storyID );

	if( story === undefined ) {
		story = ( await itemRef.child( storyID ).once( "value" ) ).val();
		storyCache.set( storyID, trimStory( story ) );
	}

	return story;
}

module.exports = getStory;