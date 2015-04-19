var config = require('../configs/config.json');
var commands = require('../configs/commands.json');
var irc = require('./irc.js');
var gist = require('./gist.js');
var app = require('../app.js');
var fs = require('fs');
var ignorelist = {};

function serversSetup(){
    for (var a in config['servers']){
        exports.servers[a] = config['servers'][a];
        exports.servers[a]['name'] = a;
        if(!fs.existsSync('./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'])){
            console.error('No directory. ./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'] + 'crash-reports/' );
            throw 'Missing Directory';
        }
        if(!fs.existsSync('./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'] + 'crash-reports/')){
            fs.mkdirSync('./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'] + 'crash-reports/');
        }
        if(!fs.existsSync('./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'] + 'crashes/')){
            fs.mkdirSync('./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'] + 'crashes/');
        }
        exports.servers[a]['crash'] = fs.watch('./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'] + 'crash-reports/');
        exports.servers[a]['crash'].name = a;

        exports.servers[a]['crash'].on('change', function(event, filename){
            if (event == 'change') {
                if (filename) {
                    if(!ignorelist[filename]) {
                        ignorelist[filename] = true;
                        var size = fs.statSync('./servers/' + exports.servers[this.name]['name'] + '/' + exports.servers[this.name]['directory'] + 'crash-reports/' + filename).size;
                        var crash = fs.readFileSync('./servers/' + exports.servers[this.name]['name'] + '/' + exports.servers[this.name]['directory'] + 'crash-reports/' + filename, "utf8");
                        if (size != 0) {
                            irc.sayToAll(exports.crashmessage);
                            if (exports.autoupload) {
                                gist.putCrash(crash, filename, function (url) {
                                    irc.sayToAll('Crash Report at: ' + url);
                                });
                            }
                        }
                    }
                }
            }
        });
    }
}

function commandsSetup(){
    for (var a in commands){
        exports.commands[a] = commands[a];
    }
}


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
    exports.apikey = config['basic']['github-api-key'];
    exports.useragent = config['basic']['github-user-agent'];
    exports.autoupload = config['basic']['auto-upload-crash'];
    exports.crashmessage = config['basic']['crash-message'];
    exports.allowcommands = config['basic']['custom-commands'];
    exports.debug = config['basic']['debug'];

    serversSetup();

    commandsSetup();

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
    fs.writeFileSync('./configs/config.json', JSON.stringify(config));
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
exports.apikey = config['basic']['github-api-key'];
exports.useragent = config['basic']['github-user-agent'];
exports.autoupload = config['basic']['auto-upload-crash'];
exports.crashmessage = config['basic']['crash-message'];
exports.allowcommands = config['basic']['custom-commands'];
exports.debug = config['basic']['debug'];
console.log('Joining IRC');
irc.newServer(config['irc']);
serversSetup();
commandsSetup();