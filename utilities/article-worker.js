const shrinkability = require( "shrinkability" );
const { parentPort } = require( "worker_threads" );

parentPort.on( "message", ( { html, story } ) => {
	const readable = shrinkability( html, story.url );
	parentPort.postMessage( {
		title: readable.title,
		html: readable.content
	} );
} );