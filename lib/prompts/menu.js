// inquirer has a cmd prompt... inside menu class.
const { prompt } = require('inquirer');

// module exports
// it assigns a func
module.exports = () => {
  // return the prompt
  return prompt([
    {
      // list style
      type: 'input',
      // each prompty has a name
      name: 'url',
      // has a message then choice
      message: 'Type the website url you want to analyse:',
      default: function() {
          return "http://digg.com";
        }
    }
  ])
    // then based on answer, we have to switch statement which one.
    .then(answer => {
      // console.log(JSON.stringify(answer, null, '  '));
      let siteUrl = answer.url;
      console.log(siteUrl);

      //
      const
      	path      = require('path'),
      	spawn     = require('child_process').spawn,
      	phantomjs = require('phantomjs-prebuilt');

      // single url in array
      var args = [siteUrl];

      args.unshift(path.join(__dirname, '../my_wappalyzer/driver.js'));

      if(phantomjs.path == null) {
        phantomjs.path = path.join(__dirname, '../../node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs');
        // ''/var/www/html/test/testme/my_wappalyzer/node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs
      }
      else {

      }
      console.log(phantomjs.path);

      var driver = spawn(phantomjs.path, args);

      driver.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      // on data error out
      driver.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

    })
    .catch(error => console.log(error));
}
