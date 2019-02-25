module.exports = superClass => class extends superClass {
	constructor( ...args ) {
		super( ...args );
		this.listenersByEventType = new Map();
	}
	
	on( eventType, callback ) {
		let listeners = this.listenersByEventType.get( eventType );
		
		if( listeners === undefined ) {
			listeners = new Set();
			this.listenersByEventType.set( eventType, listeners );
		}
		
		listeners.add( callback );
	}
	
	off( eventType, callback ) {
		let listeners = this.listenersByEventType.get( eventType );
		
		if( listeners === undefined ) {
			return;
		}
		
		if( callback === undefined ) {
			listeners.clear();
		}
		else {
			listeners.delete( callback );
		}
	}
	
	once( eventType, callback ) {
		const tempCallback = ( ...args ) => {
			this.off( eventType, tempCallback );
			callback( ...args );
		};
		this.on( eventType, tempCallback );
	}
	
	emit( eventType, ...payload ) {
		let listeners = this.listenersByEventType.get( eventType );
		
		if( listeners === undefined ) {
			return;
		}
		
		for( const listener of listeners ) {
			listener( ...payload );
		}
	}
};