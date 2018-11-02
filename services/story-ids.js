const hackernews = require( "./hackernews" );
const HashQueue = require( "../HashQueue" );

const storyIDs = new HashQueue( 10000 );

module.exports = new Promise( function( resolve, reject ) {
	let isInitialized = false;
	
	hackernews.child( "topstories" ).on( "value", snapshot => {
		const newStoryIDs = snapshot.val();
		
		for( let i = newStoryIDs.length - 1; i >= 0; i-- ) {
			const storyID = newStoryIDs[ i ];
			
			if( storyIDs.has( storyID ) ) {
				continue;
			}
			
			if( storyIDs.length === storyIDs.size ) {
				storyIDs.dequeue();
			}
			
			storyIDs.enqueue( storyID );
		}
		
		if( !isInitialized ) {
			isInitialized = true;
			resolve( storyIDs );
		}
	} );
} );