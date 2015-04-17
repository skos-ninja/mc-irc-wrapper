var config = require('../configs/config.json');
var commands = require('../configs/commands.json');
var irc = require('./irc.js');
var fs = require('fs');

fs.exists('./pid/', function(exists) {
    if(!exists){
        fs.mkdirSync('./pid/');
    }
});

fs.exists('./servers/', function(exists) {
   if(!exists){
       fs.mkdirSync('./servers/');
   }
});

exports.commands = {};
exports.servers = {};
exports.allowall = config['basic']['allow-anyone'];
exports.allowedusers = config['basic']['allowed-list'];
console.log('Joining IRC');
irc.newServer(config['irc']);

for (var a in config['servers']){
    exports.servers[a] = config['servers'][a];
    exports.servers[a]['name'] = a;
}

for (var a in commands){
    exports.commands[a] = commands[a];
}