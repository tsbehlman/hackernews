const KeyValueStore = require( "../utilities/key-value-store" );
const ValueStore = require( "../utilities/value-store" );
const Persistence = require( "../utilities/persistence" );
const hackernews = require( "./hackernews" );
const path = require( "path" );

const itemRef = hackernews.child( "item" );

let storageDirectory = process.env.STORAGE_DIR;

if( process.env.STORAGE_DIR === undefined ) {
	storageDirectory = "cache";
}

let storyRequest = Promise.resolve();

const MAX_STORIES = 10000;

const stories = new KeyValueStore( MAX_STORIES );
const ignoredStoryIDs = new ValueStore( 500 );

stories.on( "value", story => {
	itemRef.child( story.id ).child( "descendants" ).on( "value", snapshot => {
		if( snapshot.exists() ) {
			story.descendants = snapshot.val();
		}
	} );
} );

stories.on( "delete", storyId => {
	itemRef.child( storyId ).child( "descendants" ).off();
} );

const storage = new Persistence( path.join( storageDirectory, "storyIDs.bin" ), {
	maxSize: 8 * MAX_STORIES
} );

const domainPattern = /^\w+:\/\/(?:www\.)?([^\/]+)/;

function cacheStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	const story = { id, title, url, descendants };
	[ , story.domain = "unknown website" ] = domainPattern.exec( story.url ) || [];
	stories.set( story.id, story );
}

async function getStories( storyIDs ) {
	const storyPromises = [];
	
	for( const storyID of storyIDs ) {
		ignoredStoryIDs.add( storyID );
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
				cacheStory( story );
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