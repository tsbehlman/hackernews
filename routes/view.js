const { readFile } = require( "fs" ).promises;

module.exports = ( async function() {
	const [ { getStory }, { getArticle }, viewTemplate ] = await Promise.all( [
		require( "../services/stories" ),
		require( "../services/articles" ),
		( async function() {
			const rawViewTemplate = await readFile( "view-template.html" );
			return new Function( "story", "article", `return \`${rawViewTemplate}\`` );
		} )()
	] );
	
	return async function( response, storyID ) {
		const story = await getStory( storyID );
		if( story === undefined ) {
			response.statuscode = 500;
			response.end();
		}
		
		const article = await getArticle( story );
		
		if( article === undefined ) {
			response.statusCode = 307;
			response.setHeader( "Location", story.url );
			response.end();
		}
		else {
			return viewTemplate( story, article );
		}
	};
} )();