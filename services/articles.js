const os = require( "os" );
const KeyValueStore = require( "../utilities/key-value-store" );
const ValueStore = require( "../utilities/value-store" );
const fetch = require( "../utilities/fetch.js" );
const { storyCache, getStory, getStories } = require( "./stories" );
const { StaticPool } = require( "node-worker-threads-pool" );

const MAX_ARTICLES = 200;

const ARTICLE_MARKUP_SIZE_LIMIT = 1024 * 1024;

const WORKER_MODULE = require.resolve( "../utilities/article-worker.js" );

let workerPool = new StaticPool( {
	size: os.cpus().length,
	task: WORKER_MODULE
} );

const articleCache = new KeyValueStore( MAX_ARTICLES );
const failedArticles = new ValueStore( 200 );
const articlesInProgress = new Map();

async function getArticle( story ) {
	const article = articleCache.get( story.id );
	
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
}

module.exports = ( async function() {
	const storyIDs = await require( "./topstories" );
	
	const ENV = process.env.NODE_ENV || "development";
	
	if( ENV === "production" ) {
		const initialArticles = [];
		
		const initialStoryIDs = Array.from( storyIDs ).slice( -MAX_ARTICLES ).reverse();
		
		for( const story of await getStories( initialStoryIDs ) ) {
			initialArticles.push( fetchArticle( story ) );
		}
		
		storyIDs.on( "value", async ( storyID ) => {
			fetchArticle( await getStory( storyID ) );
		} );
		
		// Reduce worker pool size to 1 after the initial burst to reduce memory usage
		Promise.all( initialArticles ).finally( () => {
			workerPool.destroy();
			workerPool = new StaticPool( {
				size: 1,
				task: WORKER_MODULE
			} );
		} );
	}
	
	return {
		articleCache,
		getArticle
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
		articleCache.set( storyId, article );
	}
}

async function fetchArticle( story ) {
	if( story.url === undefined || blacklist.has( story.domain ) ) {
		return undefined;
	}
	
	const promise = ( async function() {
		try {
			const response = await fetch( story.url );
			const [ contentType ] = response.headers.get( "content-type" ).trim().split( /[\s;]+/ );
			
			const contentLength = Number( response.headers.get( "content-length" ) );
			if( contentType !== "text/html" || contentLength > ARTICLE_MARKUP_SIZE_LIMIT ) {
				return undefined;
			}
			
			const html = await response.text();
			if( html.length > ARTICLE_MARKUP_SIZE_LIMIT ) {
				return undefined;
			}
			
			return await workerPool.exec( { html, story } );
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