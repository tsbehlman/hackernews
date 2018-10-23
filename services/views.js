const { readFileSync } = require( "fs" );

const getStory = require( "./stories" );
const JSONClient = require( "./json-client" );

const outline = new JSONClient( {
	host: "outlineapi.com",
	path: "/parse_article?source_url="
} );

const viewTemplate = (function() {
	const rawViewTemplate = readFileSync( "view-template.html" );
	return new Function( "story", "article", `return \`${rawViewTemplate}\`` );
})();

async function getView( storyID ) {
	const story = await getStory( storyID );
	const articleResponse = await outline.get( encodeURIComponent( story.url ) );
	if( !articleResponse.success ) {
		res.statusCode = 307;
		res.setHeader( "Location", story.url );
		res.end();
		return;
	}
	return viewTemplate( story, articleResponse.data );
}

module.exports = getView;