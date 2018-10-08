const ENV = process.env.NODE_ENV || "development";

if( ENV === "production" ) {
	module.exports = require( "@firebase/app" ).firebase.initializeApp( {
		databaseURL: "https://hacker-news.firebaseio.com"
	} );
	require( "@firebase/database" );
}
else {
	module.exports = require( "slim-firebase-mock" ).initializeApp();
	
	const NUM_DEVELOPMENT_ITEMS = 500;
	
	function randomInt( min, max ) {
		return Math.floor( Math.random() * ( max - min ) + min );
	}
	
	function randomSentence( minLength, maxLength ) {
		const length = randomInt( minLength, maxLength );
		return new Array( length ).fill( "", 0, length ).map( () => randomString( 1, 10 ) ).join( " " );
	}
	
	function randomString( minLength, maxLength ) {
		let string = "";
		const length = randomInt( minLength, maxLength );
		for( let i = 0; i < length; i++ ) {
			string += String.fromCharCode( randomInt( 97, 122 ) );
		}
		return string;
	}
	
	const data = {
		v0: {
			topstories: [],
			item: Object.create( null )
		}
	};
	
	const startID = Math.floor( Date.now() / 1000 );
	
	for( let i = 0; i < NUM_DEVELOPMENT_ITEMS; i++ ) {
		const storyID = startID + i;
		data.v0.topstories.push( storyID );
		data.v0.item[ storyID ] = {
			id: storyID,
			title: randomSentence( 4, 10 ),
			url: "http://" + randomString( 5, 10 ) + ".com/" + randomString( 10, 20 ),
			descendants: randomInt( 0, 300 )
		};
	}
	
	module.exports.database().ref()._setValue( data );
}