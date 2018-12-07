const { readFile } = require( "fs" ).promises;

const JSONClient = require( "../utilities/json-client" );

const outline = new JSONClient( {
	host: "outlineapi.com",
	path: "/parse_article?source_url="
} );

function fail( res, story ) {
	res.statusCode = 307;
	res.setHeader( "Location", story.url );
	res.end();
}

module.exports = ( async function() {
	const [ stories, viewTemplate ] = await Promise.all( [
		require( "../services/stories" ),
		( async function() {
			const rawViewTemplate = await readFile( "view-template.html" );
			return new Function( "story", "article", `return \`${rawViewTemplate}\`` );
		} )()
	] );
	
	return async function( storyID ) {
		const story = stories.get( storyID );
		if( story === undefined ) {
			fail();
			return;
		}
		const articleResponse = await outline.get( encodeURIComponent( story.url ) );
		if( !articleResponse.success ) {
			res.statusCode = 307;
			res.setHeader( "Location", story.url );
			res.end();
			return;
		}
		return viewTemplate( story, articleResponse.data );
	};
} )();