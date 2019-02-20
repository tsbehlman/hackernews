const KeyValueStore = require( "../utilities/key-value-store" );
const ValueStore = require( "../utilities/value-store" );
const stagger = require( "../utilities/stagger" )( 25 );
const fetch = require( "../utilities/fetch.js" );
const shrinkability = require( "shrinkability" );

const articles = new KeyValueStore( 200 );
const failedArticles = new ValueStore();
const articlesInProgress = new Set();

function cacheArticle( storyId, article ) {
	articlesInProgress.delete( storyId );
	
	if( article === undefined ) {
		failedArticles.add( storyId );
		return undefined;
	}
	
	articles.set( storyId, article );
	
	return article;
}

function queueArticle( story ) {
	stagger( async () => cacheArticle( story.id, await readability( story ) ) );
}

module.exports = ( async function() {
	const stories = await require( "./stories" );
	
	for( const story of Array.from( stories.values() ).slice( -100 ).reverse() ) {
		queueArticle( story );
	}
	
	stories.on( "value", queueArticle );
	
	return async function( story ) {
		const article = articles.get( story.id );
		
		if( article !== undefined ) {
			return article;
		}
		
		return cacheArticle( story.id, await readability( story ) );
	};
} )();

const blacklist = new Set( [
	"news.ycombinator.com",
	"youtube.com"
] );

const readability = async function( story ) {
	if( story.url === undefined || blacklist.has( story.domain ) ) {
		return undefined;
	}
	try {
		const response = await fetch( story.url );
		const [ contentType ] = response.headers.get( "content-type" ).trim().split( /[\s;]+/ );
		if( contentType !== "text/html" ) {
			return undefined;
		}
		const readable = shrinkability( await response.text(), story.url );
		return {
			title: readable.title,
			html: readable.content
		};
	}
	catch( e ) {
		//console.log( "failed to parse story from " + story.domain, e );
		return undefined;
	}
}