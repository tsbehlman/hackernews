const STORIES_PER_PAGE = 30;

module.exports = Promise.all( [
	require( "./story-ids" ),
	require( "./stories" )
] )
	.then( function( [ storyIDs, getStory ] ) {
		return function( pageIndex ) {
			const startIndex = pageIndex * STORIES_PER_PAGE;
			const storyPromises = [];
			
			for( const storyID of storyIDs.slice( startIndex, startIndex + STORIES_PER_PAGE ) ) {
				storyPromises.push( getStory( storyID ) );
			}
			
			return Promise.all( storyPromises );
		}
	} );