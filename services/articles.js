const KeyValueStore = require( "../utilities/key-value-store" );
const ValueStore = require( "../utilities/value-store" );
const stagger = require( "../utilities/stagger" )( 25 );
const fetch = require( "../utilities/fetch.js" );
const shrinkability = require( "shrinkability" );

const MAX_ARTICLES = 200;

const articles = new KeyValueStore( MAX_ARTICLES );
const failedArticles = new ValueStore( 200 );
const articlesInProgress = new Map();

function cacheArticle( storyId, article ) {
	articlesInProgress.delete( storyId );
	
	if( article === undefined ) {
		failedArticles.add( storyId );
	}
	else {
		articles.set( storyId, article );
	}
	
	return article;
}

function queueArticle( story ) {
	stagger( async () => cacheArticle( story.id, await readability( story ) ) );
}

module.exports = ( async function() {
	const stories = await require( "./stories" );
	
	const ENV = process.env.NODE_ENV || "development";
	
	if( ENV === "production" ) {
		for( const story of Array.from( stories.values() ).slice( -MAX_ARTICLES ).reverse() ) {
			queueArticle( story );
		}
		
		stories.on( "value", queueArticle );
	}
	
	return async function( story ) {
		const article = articles.get( story.id );
		
		if( article !== undefined ) {
			return article;
		}
		
		if( failedArticles.has( story.id ) ) {
			return undefined;
		}
		
		if( articlesInProgress.has( story.id ) ) {
			return await articlesInProgress.get( story.id )
		}
		
		return cacheArticle( story.id, await readability( story ) );
	};
} )();

const blacklist = new Set( [
	"news.ycombinator.com",
	"youtube.com"
] );

const readability = function( story ) {
	const promise = ( async function( story ) {
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
			return undefined;
		}
	} )( story );
	articlesInProgress.set( story.id, promise );
	return promise.then( article => {
		articlesInProgress.delete( story.id );
		return article;
	} );
}