const ValueStore = require( "../utilities/value-store" );
const Persistence = require( "../utilities/persistence" );
const hackernews = require( "./hackernews" );
const { getStories } = require( "./stories.js" );
const path = require( "path" );
const { zip, forEach } = require( "rusty-iterator-utils" );

const storageDirectory = process.env.STORAGE_DIR || "cache";

const MAX_TOPSTORIES = 100000;

const storage = new Persistence( path.join( storageDirectory, "storyIDs.bin" ), {
	maxSize: 8 * MAX_TOPSTORIES
} );

const storyIDs = new ValueStore( MAX_TOPSTORIES );
const ignoredStoryIDs = new ValueStore( 500 );

function listenForStories() {
	return new Promise( resolve => {
		hackernews.child( "topstories" ).on( "value", async ( snapshot ) => {
			const newStoryIDs = snapshot.val().filter( storyID =>
				!storyIDs.has( storyID ) && !ignoredStoryIDs.has( storyID ) );
			
			await addStories( newStoryIDs );
			
			resolve();
		} );
	} );
}

let pendingStoryRequest = Promise.resolve();

async function addStories( newStoryIDs ) {
	await pendingStoryRequest;
	
	const nextStoryRequest = getStories( newStoryIDs );

	pendingStoryRequest = nextStoryRequest.then( stories =>
		forEach( zip( newStoryIDs, stories ), ( [ storyID, story ] ) => {
			if( story === undefined ) {
				ignoredStoryIDs.add( storyID );
			}
			else {
				storyIDs.add( storyID );
			}
		} )
	);

	await pendingStoryRequest;
	
	storage.write( Array.from( storyIDs ) );
}

module.exports = ( async function() {
	const storedStoryIDs = await storage.initialize( [] );

	await addStories( storedStoryIDs );

	await listenForStories();

	return storyIDs;
} )();