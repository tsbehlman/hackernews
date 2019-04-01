const { skip, take } = require( "rusty-iterator-utils" );

const STORIES_PER_PAGE = 30;

module.exports = ( async function() {
	const stories = await require( "../services/stories" );
	
	return function( pageIndex ) {
		const end = stories.size - pageIndex * STORIES_PER_PAGE;
		const start = end - STORIES_PER_PAGE;
		return Array.from( take( skip( stories.values(), start ), end - start ) ).reverse();
	}
} )();