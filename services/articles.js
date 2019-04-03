const KeyValueStore = require( "../utilities/key-value-store" );
const ValueStore = require( "../utilities/value-store" );
const fetch = require( "../utilities/fetch.js" );
const { Worker } = require( "worker_threads" );

const MAX_ARTICLES = 200;

const articles = new KeyValueStore( MAX_ARTICLES );
const failedArticles = new ValueStore( 200 );
const articlesInProgress = new Map();

const WORKER_MODULE = require.resolve( "../utilities/article-worker.js" )

module.exports = ( async function() {
	const stories = await require( "./stories" );
	
	const ENV = process.env.NODE_ENV || "development";
	
	if( ENV === "production" ) {
		for( const story of Array.from( stories.values() ).slice( -MAX_ARTICLES ).reverse() ) {
			fetchArticle( story );
		}
		
		stories.on( "value", fetchArticle );
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
		
		return await fetchArticle( story );
	};
} )();

const blacklist = new Set( [
	"news.ycombinator.com",
	"youtube.com"
] );

function cacheArticle( storyId, article ) {
	if( article === undefined ) {
		failedArticles.add( storyId );
	}
	else {
		articles.set( storyId, article );
	}
}

function shrinkArticle( articleHTML, story ) {
	return new Promise( ( resolve, reject ) => {
		const worker = new Worker( WORKER_MODULE, { workerData: { html: articleHTML, story } } );
		worker.on( "message", resolve );
		worker.on( "error", reject );
	} );
}

async function fetchArticle( story ) {
	if( story.url === undefined || blacklist.has( story.domain ) ) {
		return undefined;
	}
	
	const promise = ( async function() {
		try {
			const response = await fetch( story.url );
			const [ contentType ] = response.headers.get( "content-type" ).trim().split( /[\s;]+/ );
			if( contentType !== "text/html" ) {
				return undefined;
			}
			return await shrinkArticle( await response.text(), story );
		}
		catch( e ) {
			return undefined;
		}
	} )();
	
	articlesInProgress.set( story.id, promise );
	const article = await promise;
	articlesInProgress.delete( story.id );
	cacheArticle( story.id, article );
	return article;
}