const { readFile } = require( "fs" ).promises;

module.exports = async function( templateLocation, ...parameters ) {
	const templateSource = await readFile( templateLocation );
	return new Function( ...parameters, `return \`${ templateSource }\`` );
};