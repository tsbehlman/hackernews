const EventEmitterMixin = require( "./events-mixin" );

module.exports = class extends EventEmitterMixin(Map) {
	constructor( maxItems ) {
		super();
		this.maxItems = maxItems;
	}
	
	set( key, value ) {
		if( this.size >= this.maxItems ) {
			this.delete( this.keys().next().value );
		}
		
		super.set( key, value );
		this.emit( "value", value );
	}
	
	delete( key ) {
		super.delete( key );
		this.emit( "delete", key );
	}
};