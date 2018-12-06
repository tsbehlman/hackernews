const hackernews = require( "./hackernews" );

let storyRequest = Promise.resolve();

const MAX_STORIES = 10000;

const stories = new Map();
const itemRef = hackernews.child( "item" );

module.exports = new Promise( function( resolve, reject ) {
	let isInitialized = false;
	
	hackernews.child( "topstories" ).on( "value", snapshot => {
		const newStoryIDs = snapshot.val();
		
		const storyPromises = [];
		
		for( let i = newStoryIDs.length - 1; i >= 0; i-- ) {
			const storyID = newStoryIDs[ i ];
			
			if( stories.has( storyID ) ) {
				continue;
			}
			
			storyPromises.push( itemRef.child( storyID ).once( "value" ) );
		}
		
		const nextRequest = Promise.all( storyPromises );
		
		storyRequest = storyRequest.then( ( async () => {
			for( const snapshot of await nextRequest ) {
				let story = snapshot.val();
				if( story.type !== "story" ) {
					continue;
				}
				story = trimStory( story );
				if( stories.size === MAX_STORIES ) {
					stories.delete( stories.keys().next().value );
				}
				stories.set( story.id, story );
			}
			
			if( !isInitialized ) {
				isInitialized = true;
				resolve( stories );
			}
			
			return nextRequest;
		} )() );
	} );
} );

function trimStory( { id, title, url = "https://news.ycombinator.com/item?id=" + id, descendants = 0 } ) {
	return { id, title, url, descendants };
}