const storyIDs = require( "./story-ids" );
const getStory = require( "./stories" );

const STORIES_PER_PAGE = 30;

function getPage( pageIndex ) {
	debugger;
	const startIndex = pageIndex * STORIES_PER_PAGE;
	const storyPromises = [];
	
	for( const storyID of storyIDs.slice( startIndex, startIndex + STORIES_PER_PAGE ) ) {
		storyPromises.push( getStory( storyID ) );
	}
	
	return Promise.all( storyPromises );
}

module.exports = getPage;