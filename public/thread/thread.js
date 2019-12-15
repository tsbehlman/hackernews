(function() {
	window.initialize = async function( commentIDs ) {
		document.body.appendChild( await getComments( commentIDs ) );
	};
	
	function markupForComment( { by, text, kids = [] } ) {
		const container = document.createElement( "details" );
		container.className = "comment";
		container.open = true;
		const summary = document.createElement( "summary" );
		const meta = document.createElement( "h4" );
		meta.appendChild( document.createTextNode( by ) );
		summary.appendChild( meta );
		container.appendChild( summary );
		const body = document.createElement( "p" );
		body.className = "body";
		body.innerHTML = text;
		container.appendChild( body );
		if( kids.length > 0 ) {
			const loadComments = document.createElement( "button" );
			loadComments.appendChild( document.createTextNode( `Load ${ kids.length } comment${ kids.length !== 1 ? "s" : "" }` ) );
			loadComments.onclick = async function( e ) {
				this.disabled = true;
				this.replaceWith( await getComments( kids ) );
			};
			container.appendChild( loadComments );
		}
		return container;
	}
	
	async function getComments( commentIDs ) {
		const comments = await Promise.all( commentIDs.map( getItem ) );
		
		const fragment = document.createDocumentFragment();
		
		for( const comment of comments ) {
			fragment.appendChild( markupForComment( comment ) );
		}
		
		return fragment;
	}
	
	async function getItem( id ) {
		const response = await fetch( `https://hacker-news.firebaseio.com/v0/item/${ id }.json` );
		return await response.json();
	}
})();