var config = require('../configs/config.json');
var commands = require('../configs/commands.json');
var irc = require('./irc.js');
var app = require('../app.js');
var fs = require('fs');

exports.reload = function(callback){
    var old_irc = config['irc'];
    config = null;
    commands = null;
    exports.commands = {};
    exports.servers = {};

    delete require.cache[app.rundir + '/configs/config.json'];
    delete require.cache[app.rundir + '/configs/commands.json'];

    config = require('../configs/config.json');
    commands = require('../configs/commands.json');
    exports.allowall = config['basic']['allow-anyone'];
    exports.allowedusers = config['basic']['allowed-list'];

    for (var a in config['servers']){
        exports.servers[a] = config['servers'][a];
        exports.servers[a]['name'] = a;
    }

    for (var a in commands){
        exports.commands[a] = commands[a];
    }

    if(JSON.stringify(old_irc) != JSON.stringify(config['irc'])){
        irc.deleteServer();
        irc.newServer(config['irc']);
    }
    old_irc = null;

    callback(true);
};

exports.save = function(){
    config['basic']['allowed-list'] = exports.allowedusers;
    commands = exports.commands;
    fs.writeFileSync('./configs/config.json', JSON.stringify(config['irc']));
    fs.writeFileSync('./configs/commands.json', JSON.stringify(commands));
};

exports.saveCommands = function(){
    commands = exports.commands;
    fs.writeFileSync('./configs/commands.json', JSON.stringify(commands));
};

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