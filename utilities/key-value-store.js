const EventEmitter = require( "events" );

module.exports = class extends Map {
	constructor( maxItems ) {
		super();
		this.maxItems = maxItems;
		this.events = new EventEmitter();
	}
	
	set( key, value ) {
		if( this.size >= this.maxItems ) {
			this.delete( this.keys().next().value );
		}
		
		super.set( key, value );
		this.events.emit( "value", value );
	}
	
	delete( key ) {
		super.delete( key );
		this.emit( "delete", key );
	}
	
	on( type, listener ) {
		return this.events.on( type, listener );
	}
	
	once( type, listener ) {
		return this.events.once( type, listener );
	}
	
	emit( type, ...args ) {
		return this.events.emit( type, ...args );
	}
};