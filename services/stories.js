const Persistence = require( "../utilities/persistence" );
const hackernews = require( "./hackernews" );
const path = require( "path" );

let storyRequest = Promise.resolve();

const MAX_STORIES = 10000;
const MAX_IGNORED_STORIES = 500;

const stories = new Map();
const ignoredStoryIDs = new Set();

const itemRef = hackernews.child( "item" );

let storageDirectory = process.env.STORAGE_DIR;

if( process.env.STORAGE_DIR === undefined ) {
	storageDirectory = "cache";
}

const storage = new Persistence( path.join( storageDirectory, "storyIDs.bin" ), {
	maxSize: 8 * MAX_STORIES
} );

function ignoreStoryID( storyID ) {
	if( ignoredStoryIDs.size >= MAX_IGNORED_STORIES ) {
		ignoredStoryIDs.delete( ignoredStoryIDs.values().next().value );
	}
	ignoredStoryIDs.add( storyID );
}

function cacheStory( story ) {
	if( stories.size >= MAX_STORIES ) {
		const oldestStoryID = stories.keys().next().value;
		stories.delete( oldestStoryID );
		itemRef.child( oldestStoryID ).child( "descendants" ).removeAllListeners( "value" );
	}
	stories.set( story.id, story );
	itemRef.child( story.id ).child( "descendants" ).on( "value", snapshot => {
		if( snapshot.exists() ) {
			story.descendants = snapshot.val();
		}
	} );
}

async function getStories( storyIDs ) {
	const storyPromises = [];
	
	for( const storyID of storyIDs ) {
		ignoreStoryID( storyID );
		storyPromises.push( itemRef.child( storyID ).once( "value" ) );
	}
	
	const nextRequest = Promise.all( storyPromises );
	
	await storyRequest;
	
	storyRequest = ( async () => {
		for( const snapshot of await nextRequest ) {
			const storyID = parseInt( snapshot.key );
			const story = snapshot.val();
			
			if( story === null ) {
				ignoredStoryIDs.delete( storyID );
			}
			else if( story.type === "story" ) {
				ignoredStoryIDs.delete( storyID );
				cacheStory( trimStory( story ) );
			}
		}
	} )();
	
	await storyRequest;
}

function listenForStories() {
	return new Promise( function( resolve, reject ) {
		let isInitialized = false;
		
		hackernews.child( "topstories" ).on( "value", snapshot => {
			const newStoryIDs = snapshot.val().filter( storyID => !stories.has( storyID ) && !ignoredStoryIDs.has( storyID ) );
			
			getStories( newStoryIDs ).then( () => {
				storage.write( Array.from( stories.keys() ) );
				
				if( !isInitialized ) {
					isInitialized = true;
					resolve();
				}
			} );
		} );
	} );
}

module.exports = ( async function() {
	const storedStoryIDs = await storage.initialize( [] );
	
	await getStories( storedStoryIDs );
	
	await listenForStories();
	
	return stories;
} )();

function trimStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	return { id, title, url, descendants };
}