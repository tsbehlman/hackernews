const EventEmitterMixin = require( "./events-mixin" );

module.exports = class extends EventEmitterMixin(Set) {
	constructor( maxItems ) {
		super();
		this.maxItems = maxItems;
	}

	add( value ) {
		if( this.size >= this.maxItems ) {
			this.delete( this[ Symbol.iterator ]().next().value );
		}

		super.add( value );
		this.emit( "value", value );
	}
	
	delete( key ) {
		super.delete( key );
		this.emit( "delete", key );
	}
};