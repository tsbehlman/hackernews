const fs = require( "fs" ).promises;
const path = require( "path" );
const MessagePack = require( "what-the-pack" );

class Persistence {
	constructor( filePath, { maxSize = 1 << 13, dictionary = [] } ) {
		this.filePath = filePath;
		this.fileHandle = undefined;
		this.nextTransaction = Promise.resolve();
		this.binaryTranslator = new MessagePack( maxSize );
		this.binaryTranslator.register( ...dictionary );
	}
	
	async initialize( defaultValue ) {
		await fs.mkdir( path.dirname( this.filePath ), { recursive: true } );
		try {
			this.fileHandle = await fs.open( this.filePath, "r+" );
		}
		catch( e ) {
			this.fileHandle = await fs.open( this.filePath, "w+" );
			return defaultValue;
		}
		
		const data = await this.fileHandle.readFile( {} );
		
		try {
			return this.binaryTranslator.decode( data );
		}
		catch( e ) {
			console.log( e );
			return defaultValue;
		}
	}
	
	write( data ) {
		this.nextTransaction = this.nextTransaction.then( async () => {
			const fileData = this.binaryTranslator.encode( data );
			await this.fileHandle.truncate( 0 );
			await this.fileHandle.write( fileData, 0, fileData.length, 0 );
		} );
	}
}

module.exports = Persistence;