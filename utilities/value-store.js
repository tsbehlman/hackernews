const EventEmitter = require( "events" );

module.exports = class extends Set {
	constructor( maxItems ) {
		super();
		this.maxItems = maxItems;
		this.events = new EventEmitter();
	}

	add( value ) {
		if( this.size >= this.maxItems ) {
			this.delete( this[ Symbol.iterator ]().next().value );
		}

		super.add( value );
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