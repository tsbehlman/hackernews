const RingBuffer = require( "ring-buffer" );

class HashQueue {
	constructor( maxItems ) {
		this.hash = new Set();
		this.queue = new RingBuffer( maxItems );
	}
	
	get length() {
		return this.queue.length;
	}
	
	get size() {
		return this.queue.size;
	}
	
	enqueue( item ) {
		this.hash.add( item );
		this.queue.addFirst( item );
	}
	
	dequeue() {
		const item = this.queue.removeLast();
		this.hash.delete( item );
		return item;
	}
	
	has( item ) {
		return this.hash.has( item );
	}
	
	slice( start, end ) {
		return this.queue.slice( start, end );
	}
}

module.exports = HashQueue;