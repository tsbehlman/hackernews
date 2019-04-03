const shrinkability = require( "shrinkability" );
const { parentPort, workerData } = require( "worker_threads" );

const readable = shrinkability( workerData.html, workerData.story.url );
parentPort.postMessage( {
	title: readable.title,
	html: readable.content
} );