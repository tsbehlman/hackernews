const { readFile } = require( "fs" ).promises;

const JSONClient = require( "./json-client" );

const outline = new JSONClient( {
	host: "outlineapi.com",
	path: "/parse_article?source_url="
} );

module.exports = Promise.all( [
	require( "./stories" ),
	readFile( "view-template.html" )
		.then( function( rawViewTemplate ) {
			return new Function( "story", "article", `return \`${rawViewTemplate}\`` );
		} )
] )
	.then( function( [ getStory, viewTemplate ] ) {
		return async function( storyID ) {
			const story = await getStory( storyID );
			const articleResponse = await outline.get( encodeURIComponent( story.url ) );
			if( !articleResponse.success ) {
				res.statusCode = 307;
				res.setHeader( "Location", story.url );
				res.end();
				return;
			}
			return viewTemplate( story, articleResponse.data );
		};
	} );