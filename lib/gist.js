var files = require('./files.js');
var request = require("request");

exports.putCrash = function(crash, filename, callback){
    if(!files.apikey){
        console.log('No github apikey!');
        callback('No github apikey!');
        return
    }
    if(!files.useragent){
        console.log('No github user agent!');
        callback('No github user agent!');
        return
    }
    var body = {
        "description": 'Minecraft Crash',
        "public": true,
        "files": {}
    };
    body['files'][filename] = {"content": crash};
    request({
        uri: "https://api.github.com/gists",
        headers: {
            'User-Agent': files.useragent,
            'Authorization': 'token ' + files.apikey
        },
        method: "POST",
        body: JSON.stringify(body),
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    }, function(error, response, body) {
        callback(JSON.parse(body)['html_url']);
    });
};