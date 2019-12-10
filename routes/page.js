const { skip, take } = require( "rusty-iterator-utils" );

const STORIES_PER_PAGE = 30;

module.exports = ( async function() {
	const [ { getStories }, storyIDs ] = await Promise.all( [
		require( "../services/stories" ),
		require( "../services/topstories" )
	] );
	
	return function( pageIndex ) {
		const end = storyIDs.size - pageIndex * STORIES_PER_PAGE;
		const start = end - STORIES_PER_PAGE;
		const pageIDs = Array.from( take( skip( storyIDs, start ), end - start ) ).reverse();
		return getStories( pageIDs );
	}
} )();