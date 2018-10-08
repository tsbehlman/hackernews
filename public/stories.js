(function() {
	"use strict";
	
	const domainPattern = /^\w+:\/\/(?:www\.)?([^\/]+)/;
	
	function listItemForStory( story ) {
		const listItem = document.createElement( "a" );
		listItem.target = "_blank";
		listItem.href = story.url;
		listItem.appendChild( document.createTextNode( story.title + "\n" ) );
		
		const commentLink = document.createElement( "a" );
		commentLink.target = "_blank";
		commentLink.href = "https://news.ycombinator.com/item?id=" + story.id;
		
		const domainMatches = domainPattern.exec( story.url );
		let domain = "news.ycombinator.com";
		
		if( domainMatches !== null ) {
			domain = domainMatches[ 1 ];
		}
		
		const commentsText = `${story.descendants.toLocaleString()} comments  ${domain}`
		commentLink.appendChild( document.createTextNode( commentsText ) );
		listItem.appendChild( commentLink );
		
		return listItem;
	}
	
	let loadMoreLink = null;
	let waitingForStories = false;
	let pageNumber = 1;
	const storyIDs = new Set();
	
	function loadMoreTouchCancel( e ) {
		document.removeEventListener( "touchend", onTouchEnd, false );
		document.removeEventListener( "touchcancel", loadMoreTouchCancel, false );
	}
	
	function loadMoreTouchStart( e ) {
		var onTouchEnd = (function( firstTarget ) {
			return function( e ) {
				if( e.target === firstTarget ) {
					loadMore();
				}
				loadMoreTouchCancel( e );
			};
		})( e.target );
		document.addEventListener( "touchend", onTouchEnd, false );
		document.addEventListener( "touchcancel", loadMoreTouchCancel, false );
	}
	
	function domLoaded() {
		document.removeEventListener( "DOMContentLoaded", domLoaded, false );
		
		loadMoreLink = document.getElementById( "load-more" );
		
		loadMoreLink.addEventListener( "touchstart", loadMoreTouchStart, false );
		loadMoreLink.addEventListener( "click", loadMore, false );
		
		loadMore();
	}
	
	document.addEventListener( "DOMContentLoaded", domLoaded, false );
	
	function addStories( stories ) {
		var fragment = document.createDocumentFragment();
		
		for( const story of stories ) {
			if( storyIDs.has( story.id ) ) {
				continue;
			}
			
			storyIDs.add( story.id );
			
			fragment.appendChild( listItemForStory( story ) );
		}
		
		fragment.appendChild( document.createElement( "hr" ) );
		
		document.body.insertBefore( fragment, loadMoreLink );
	}
	
	async function loadMore() {
		if( waitingForStories ) {
			return;
		}
		
		loadMoreLink.firstChild.nodeValue = "Loading...";
		waitingForStories = true;
		
		const response = await fetch( "/page/" + pageNumber++ );
		addStories( await response.json() );
		
		loadMoreLink.firstChild.nodeValue = "Load More";
		waitingForStories = false;
	}
})();