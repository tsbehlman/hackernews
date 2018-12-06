(function() {
	"use strict";
	
	const domainPattern = /^\w+:\/\/(?:www\.)?([^\/]+)/;
	
	function listItemForStory( story ) {
		let commentURL = "https://news.ycombinator.com/item?id=" + story.id;
		const domainMatches = domainPattern.exec( story.url );
		let domain = "news.ycombinator.com";
		
		if( domainMatches !== null ) {
			domain = domainMatches[ 1 ];
		}
		
		const listItem = document.createElement( "a" );
		listItem.target = "_blank";
		if( domain === "news.ycombinator.com" ) {
			listItem.href = commentURL;
		}
		else {
			listItem.href = "view/" + story.id;
		}
		listItem.appendChild( document.createTextNode( story.title + "\n" ) );
		
		const commentLink = document.createElement( "a" );
		commentLink.target = "_blank";
		commentLink.href = commentURL;
		
		const commentsText = `${story.descendants.toLocaleString()} comments  `
		commentLink.appendChild( document.createTextNode( commentsText ) );
		listItem.appendChild( commentLink );
		
		const domainLink = document.createElement( "a" );
		domainLink.target = "_blank";
		domainLink.href = story.url;
		
		domainLink.appendChild( document.createTextNode( domain ) );
		listItem.appendChild( domainLink );
		
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
		
		const response = await fetch( "page/" + pageNumber++ );
		addStories( await response.json() );
		
		loadMoreLink.firstChild.nodeValue = "Load More";
		waitingForStories = false;
	}
})();