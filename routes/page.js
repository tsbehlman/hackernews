const STORIES_PER_PAGE = 30;

module.exports = ( async function() {
	const stories = await require( "../services/stories" );
	
	return function( pageIndex ) {
		const end = stories.size - pageIndex * STORIES_PER_PAGE;
		const start = end - STORIES_PER_PAGE;
		return Array.from( stories.values() ).slice( start, end ).reverse();
	}
} )();