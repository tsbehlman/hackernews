const STORIES_PER_PAGE = 30;

module.exports = ( async function() {
	const stories = await require( "./stories" );
	
	return function( pageIndex ) {
		const start = pageIndex * STORIES_PER_PAGE;
		const end = start + STORIES_PER_PAGE;
		return Array.from( stories.entries() ).slice( start, end ).map( entry => entry[ 1 ] );
	}
} )();