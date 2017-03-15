// use strict
'use strict';

// const
// path
// child_process, spawn,
// phantomjs
const
	path      = require('path'),
	spawn     = require('child_process').spawn,
	phantomjs = require('phantomjs-prebuilt');

// exports run
// func args, callback
exports.run = function(args, callback) {
	// test
	//debugger;

	// unshift means push to the head of array
	args.unshift(path.join(__dirname, 'driver.js'));

	// test
	//debugger;

	// get the phantomjs path and spawn
	var driver = spawn(phantomjs.path, args);

	// on data out
	driver.stdout.on('data', (data) => {
		// see callback it is below
		// it is just a print out.
		callback(`${data}`, null);
	});

	// on data error out
	driver.stderr.on('data', (data) => {
		callback(null, `${data}`);
	});
}

// module has no parent
if ( !module.parent ) {
	// exports
	// we get something like this
	// [ '/home/kenpeter/.nvm/versions/node/v6.10.0/bin/node',
  // '/var/www/html/test/testme/my_wappalyzer/index.js',
  // 'https://wappalyzer.com' ]
	// .slice means slice it ang get the remain
	// .slice(2) == [https://wappalyzer.com], which is the site name
	exports.run(process.argv.slice(2), function(stdout, stderr) {
		if ( stdout ) {
			process.stdout.write(stdout);
		}

		if ( stderr ) {
			process.stderr.write(stderr);
		}
	});
}
