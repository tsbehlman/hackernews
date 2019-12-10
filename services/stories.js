const KeyValueStore = require( "../utilities/key-value-store" );
const hackernews = require( "./hackernews" );

const itemRef = hackernews.child( "item" );

const MAX_STORIES = 1000;

const storyCache = new KeyValueStore( MAX_STORIES );
const storyPromises = new Map();

storyCache.on( "value", story => {
	itemRef.child( story.id ).child( "descendants" ).on( "value", snapshot => {
		if( snapshot.exists() ) {
			story.descendants = snapshot.val();
		}
	} );
} );

storyCache.on( "delete", storyId => {
	itemRef.child( storyId ).child( "descendants" ).off();
} );

const domainPattern = /^\w+:\/\/(?:www\.)?([^\/]+)/;

function normalizeStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	const story = { id, title, url, descendants };
	[ , story.domain = "unknown website" ] = domainPattern.exec( story.url ) || [];
	return story;
};

async function fetchStory( storyID ) {
	const snapshot = await itemRef.child( storyID ).once( "value" );
	let story = snapshot.val();
	
	if( story === null || story.type !== "story" || story.title === undefined ) {
		return undefined;
	}
	
	story = normalizeStory( story );
	storyCache.set( storyID, story );
	
	return story;
}

async function getStory( storyID ) {
	let story = storyCache.get( storyID );

	if( story !== undefined ) {
		return story;
	}

	let storyPromise = storyPromises.get( storyID );

	if( storyPromise !== undefined ) {
		return storyPromise;
	}

	storyPromise = fetchStory( storyID );
	storyPromises.set( storyID, storyPromise );

	story = await storyPromise;

	storyPromises.delete( storyID );

	return story;
}

module.exports = {
	storyCache,
	getStory,
	getStories: function( storyIDs ) {
		return Promise.all( storyIDs.map( getStory ) );
	}
};