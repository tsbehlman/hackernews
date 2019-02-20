module.exports = function( maxConcurrent ) {
	const tasks = [];
	
	let numInProgress = 0;
	
	function queueNextTask() {
		if( numInProgress < maxConcurrent && tasks.length > 0 ) {
			tasks.shift()().finally( complete );
			numInProgress++;
		}
	}
	
	function complete() {
		numInProgress--;
		queueNextTask();
	}
	
	return function( task ) {
		tasks.push( task );
		queueNextTask();
	};
};