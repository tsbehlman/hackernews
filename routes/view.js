const { readFile } = require( "fs" ).promises;

const JSONClient = require( "../utilities/json-client" );

const outline = new JSONClient( {
	host: "outlineapi.com",
	path: "/v2/parse_article?source_url="
} );

function fail( res, story ) {
	if( story !== undefined ) {
		res.statusCode = 307;
		res.setHeader( "Location", story.url );
	}
	else {
		res.statuscode = 500;
	}
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
	
	return async function( response, storyID ) {
		const story = stories.get( storyID );
		if( story === undefined ) {
			fail( response, story );
			return;
		}
		const articleResponse = await outline.get( encodeURIComponent( story.url ) );
		if( !articleResponse.success ) {
			fail( response, story )
			return;
		}
		return viewTemplate( story, articleResponse.data );
	};
} )();