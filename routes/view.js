const htmlTemplate = require( "../utilities/html-template" );

module.exports = ( async function() {
	const [ { getStory }, { getArticle }, template ] = await Promise.all( [
		require( "../services/stories" ),
		require( "../services/articles" ),
		htmlTemplate( "public/view/index.html", "story", "article" )
	] );
	
	return async function( response, storyID ) {
		const story = await getStory( storyID );
		
		if( story === undefined ) {
			response.statuscode = 500;
			response.end();
			return;
		}
		
		const article = await getArticle( story );
		
		if( article === undefined ) {
			response.statusCode = 307;
			response.setHeader( "Location", story.url );
			response.end();
			return;
		}
		
		return template( story, article );
	};
} )();