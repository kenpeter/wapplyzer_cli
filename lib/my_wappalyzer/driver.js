// it is a closure.
// func we have
(function() {
	var
		url, // url, we pass
		originalUrl, // a copy url
		scriptDir, // script dir, what script????
		scriptPath      = require('fs').absolute(require('system').args[0]), //
		resourceTimeout = 9000, // connect 9s max
		args            = [], // args from input
		debug           = false; // Output debug messages, --debug
		quiet           = false; // Don't output errors,

	try {
		// Working directory
		scriptDir = scriptPath.split('/');
		// require('system').args == /var/www/html/test/testme/my_wappalyzer/driver.js,https:/wappalyzer.com
		//test
		//console.log( require('system').args );
		//console.log("--");

		scriptDir.pop();
		//test
		//console.log(scriptDir);

		scriptDir = scriptDir.join('/');
		//test
		//console.log(scriptDir);

		// change to current dir
		require('fs').changeWorkingDirectory(scriptDir);

		// loop through each args
		// e.g. /path/to/node /path/to/index.js https://wappalyzer.com --quiet
		require('system').args.forEach(function(arg, i) {
			// e.g. --verbose
			//
			var arr = /^(--[^=]+)=(.+)$/.exec(arg);

			if ( arr && arr.length === 3 ) {
				arg   = arr[1]; // index 1, --verbose or --quiet or timeout
				value = arr[2]; // index 2, value
			}

			switch ( arg ) {
				case '-v':
				case '--verbose':
					debug = true;

					break;
				case '-q':
				case '--quiet':
					quiet = true;

					break;
				case '--resource-timeout':
					resourceTimeout = value;

					break;
				default:
					url = originalUrl = arg;
			}
		});

		// no url, throw Error
		if ( !url ) {
			throw new Error('Usage: phantomjs ' + require('system').args[0] + ' <url>');
		}

		// inject wappalyzer.js to phantom
		if ( !phantom.injectJs('wappalyzer.js') ) {
			throw new Error('Unable to open file js/wappalyzer.js');
		}

		// so we extend wappalyzer with .driver
		// .driver = obj
		// wappalyzer global variable
		wappalyzer.driver = {
			/**
			 * Log messages to console
			 */
			// log, func, with args
			log: function(args) {
				// args type, error
				if ( args.type === 'error' ) {
					// not quiet
					if ( !quiet ) {
						// std err, write args msg
						require('system').stderr.write(args.message + "\n");
					}
				} else if ( debug || args.type !== 'debug' ) {
					// debug or args. type not debug
					// require sytem std out, write
					require('system').stdout.write(args.message + "\n");
				}
			},

			myConsoleLog: function(myObject) {
				console.log(JSON.stringify(myObject, null, 4));
			},

			/**
			 * Display apps
			 */
			// display tech stack app they using.
			displayApps: function() {
				// app, category
				var
					app, cats,
					apps  = [], // many apps, so array
					// count, it is detected, obj, keys
					// detected[url]
					// .length, so..... deteted how many apps
					count = wappalyzer.detected[url] ? Object.keys(wappalyzer.detected[url]).length : 0;

				// log, display apps
				wappalyzer.log('driver.displayApps');

				//test
				//console.log(wappalyzer.detected);
				//console.log(JSON.stringify(wappalyzer.detected, null, 4));

				// count
				if ( count ) {
					// each app
					for ( app in wappalyzer.detected[url] ) {
						//test
						//console.log(app);
						// app is the name of tech, like nginx, ubuntu......

						// empty category
						cats = [];

						wappalyzer.apps[app].cats.forEach(function(cat) {
							// cat is number. It is number.
							cats.push(wappalyzer.categories[cat]);
						});

						// push to apps, apps is array
						apps.push({
							name: app,
							confidence: wappalyzer.detected[url][app].confidenceTotal,
							version:    wappalyzer.detected[url][app].version,
							icon:       wappalyzer.apps[app].icon,
							categories: cats
						});
					}

					// driver send response to somewhere, stdout
					// apps

					this.myConsoleLog(apps);

					// Hak, I don't want to send to stdout
					//wappalyzer.driver.sendResponse(apps);
				}
			},

			/**
			 * Send response
			 */
			sendResponse: function(apps) {
				apps = apps || [];

				// require
				// system, stdout, write
				// json stringify
				// {url: xxx, orgUrl: xxx, app: app}
				//require('system').stdout.write(JSON.stringify({ url: url, originalUrl: originalUrl, applications: apps }) + "\n");
				require('system').stdout.write(JSON.stringify(apps) + "\n");
			},

			// init, func
			/**
			 * Initialize
			 */
			init: function() {
				// page, check url
				// hostname, domain name????
				var
					page, hostname,
					headers = {}; // headers, what headers?
					a       = document.createElement('a'), // <a> element
					json    = JSON.parse(require('fs').read('apps.json')); // parse app array

				// log init
				wappalyzer.log('driver.init');

				// <a> with href
				a.href = url.replace(/#.*$/, '');

				// a.hostname
				hostname = a.hostname;

				//test
				//console.log('-- test --');
				//console.log(a.href); // because url can have other parameters
				//console.log(a.hostname); // pure hostname

				// wapp has apps, the long json
				wappalyzer.apps       = json.apps;
				// wapp has cat, the long json
				wappalyzer.categories = json.categories;

				// create a page
				page = require('webpage').create();

				//test
				//this.myConsoleLog(wappalyzer);

				page.settings.loadImages      = false;
				page.settings.userAgent       = 'Mozilla/5.0 (compatible; Wappalyzer; +https://github.com/AliasIO/Wappalyzer)';
				page.settings.resourceTimeout = resourceTimeout;

				page.onConsoleMessage = function(message) {
					require('system').stdout.write(message + "\n");
				};

				page.onError = function(message) {
					wappalyzer.log(message, 'error');
				};

				page.onResourceTimeout = function() {
					wappalyzer.log('Resource timeout', 'error');

					wappalyzer.driver.sendResponse();

					phantom.exit(1);
				};

				page.onResourceReceived = function(response) {
					// Basically, we examine all the headers, then we match particular one
					// to determine tech
					/*
					{
					    "body": "",
					    "bodySize": 2610,
					    "contentType": "text/html; charset=UTF-8",
					    "headers": [
					        {
					            "name": "Content-Encoding",
					            "value": "gzip"
					        },
					        {
					            "name": "Content-Type",
					            "value": "text/html; charset=UTF-8"
					        },
					        {
					            "name": "Date",
					            "value": "Wed, 15 Mar 2017 03:17:46 GMT"
					        },
					        {
					            "name": "Etag",
					            "value": "\"ca16646b6d8a9c0981810175313715ebf9075a51\""
					        },
					        {
					            "name": "Server",
					            "value": "TornadoServer/2.3"
					        },
					        {
					            "name": "Set-Cookie",
					            "value": "frontend.auid=THJBFw_QSPyDVOCpfoPjqw; Domain=digg.com; Path=/\npreferred_view=mobile; Path=/\niphone=false; Path=/"
					        },
					        {
					            "name": "Vary",
					            "value": "Accept-Encoding"
					        },
					        {
					            "name": "transfer-encoding",
					            "value": "chunked"
					        },
					        {
					            "name": "Connection",
					            "value": "keep-alive"
					        }
					    ],
					    "id": 1,
					    "redirectURL": null,
					    "stage": "start",
					    "status": 200,
					    "statusText": "OK",
					    "time": "2017-03-15T03:17:47.019Z",
					    "url": "http://digg.com/"
					}
					*/

					//console.log('-- test --');
					//console.log(JSON.stringify(response, null, 4));

					if ( response.url.replace(/\/$/, '') === url.replace(/\/$/, '') ) {
						if ( response.redirectURL ) {
							url = response.redirectURL;

							return;
						}

						if ( response.stage === 'end' && response.status === 200 && response.contentType.indexOf('text/html') !== -1 ) {
							response.headers.forEach(function(header) {
								headers[header.name.toLowerCase()] = header.value;
							});
						}
					}
				};

				page.onResourceError = function(resourceError) {
					wappalyzer.log(resourceError.errorString, 'error');
				};

				page.open(url, function(status) {
					var html, environmentVars;

					if ( status === 'success' ) {
						html = page.content;

						if ( html.length > 50000 ) {
							html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
						}

						// Collect environment variables
						environmentVars = page.evaluate(function() {
							var i, environmentVars;

							for ( i in window ) {
								environmentVars += i + ' ';
							}

							return environmentVars;
						});

						wappalyzer.log({ message: 'environmentVars: ' + environmentVars });

						environmentVars = environmentVars.split(' ').slice(0, 500);

						wappalyzer.analyze(hostname, url, {
							html:    html,
							headers: headers,
							env:     environmentVars
						});

						phantom.exit(0);
					} else {
						wappalyzer.log('Failed to fetch page', 'error');

						wappalyzer.driver.sendResponse();

						phantom.exit(1);
					}
				});
			}
		};

		wappalyzer.init();
	} catch ( e ) {
		wappalyzer.log(e, 'error');

		wappalyzer.driver.sendResponse();

		phantom.exit(1);
	}
})();
