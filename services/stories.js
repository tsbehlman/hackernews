const Persistence = require( "../utilities/persistence" );
const hackernews = require( "./hackernews" );

let storyRequest = Promise.resolve();

const MAX_STORIES = 10000;
const MAX_IGNORED_STORIES = 500;

const stories = new Map();
const ignoredStoryIDs = new Set();

const itemRef = hackernews.child( "item" );

function ignoreStory( story ) {
	if( ignoredStoryIDs.size >= MAX_IGNORED_STORIES ) {
		ignoredStoryIDs.delete( ignoredStoryIDs.values().next().value );
	}
	ignoredStoryIDs.add( story.id );
}

function cacheStory( story ) {
	if( stories.size >= MAX_STORIES ) {
		stories.delete( stories.keys().next().value );
	}
	stories.set( story.id, story );
}

module.exports = new Promise( function( resolve, reject ) {
	let isInitialized = false;
	
	const storage = new Persistence( "cache/stories.bin", {
		maxSize: 1 << 23,
		dictionary: [ "id", "title", "url", "descendants" ]
	} );
	storage.initialize( [] ).then( persistentStories => {
		for( const story of persistentStories ) {
			cacheStory( story );
		}
		
		persistentStories = undefined;
		
		hackernews.child( "topstories" ).on( "value", snapshot => {
			const newStoryIDs = snapshot.val();
			
			const storyPromises = [];
			
			for( const storyID of newStoryIDs ) {
				if( !stories.has( storyID ) && !ignoredStoryIDs.has( storyID ) ) {
					storyPromises.push( itemRef.child( storyID ).once( "value" ) );
				}
			}
			
			const nextRequest = Promise.all( storyPromises );
			
			storyRequest = storyRequest.then( async () => {
				for( const snapshot of await nextRequest ) {
					const story = snapshot.val();
					
					if( story === null ) {
						continue;
					}
					
					if( story.type !== "story" ) {
						ignoreStory( story );
						continue;
					}
					
					cacheStory( trimStory( story ) );
				}
				
				storage.write( Array.from( stories.values() ) );
				
				if( !isInitialized ) {
					isInitialized = true;
					resolve( stories );
				}
			} );
		} );
	} );
} );

function trimStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	return { id, title, url, descendants };
}