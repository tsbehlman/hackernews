const htmlTemplate = require( "../utilities/html-template" );

module.exports = ( async function() {
	const [ { getStory }, template ] = await Promise.all( [
		require( "../services/stories" ),
		htmlTemplate( "public/thread/index.html", "story" )
	] );

	return async function( response, storyID ) {
		const story = await getStory( storyID );

		if( story === undefined ) {
			response.statuscode = 500;
			response.end();
			return;
		}
		
		return template( story );
	};
} )();