//<editor-fold desc='Loading internal node functions'>
var EventEmitter = require('events').EventEmitter;
var stdin = process.openStdin();
var fs = require('fs');
var request = require('request');
var ignorelist = {};
//</editor-fold>

//<editor-fold desc='Registering exports'>
exports.rundir = __dirname;
exports.starttime = new Date();
exports.uptime = function (foo) {
    var sec_num = parseInt(foo + '', 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time = hours+' hours '+minutes+' minutes '+seconds+' seconds.';
    return time;
};
exports.fs = fs;
exports.irc = {};
exports.commands = {};
exports.console = {};
exports.servers = {};
exports.modules = {};
exports.config = {};
exports.config.crash_on_error = false;
exports.commands.register = function(cmdname, eventname, help_display, help_description){
    if(exports.config.debug){
        console.log(cmdname + ', Event: ' + eventname + ', Help Display: ' + help_display + ', Help Description: ' + help_description);
    }
    if(exports.commands[cmdname]){
        console.log(cmdname + ' already exists');
    }
    exports.commands[cmdname] = {
        cmd: cmdname,
        event: eventname,
        displayhelp: help_display,
        helpdesc: help_description
    };
    console.log(cmdname + ' hook added');
};
exports.commands.unregister = function(cmdname){
    if(exports.commands[cmdname]){
        delete exports.commands[cmdname];
        console.log(cmdname + ' hook removed');
    }
    else{
        console.log(cmdname + " doesn't exist");
    }
};
exports.servers.putCrash = function(crash, filename, callback){
    if(!exports.config.apikey){
        console.log('No github apikey!');
        callback('No github apikey!');
        return
    }
    if(!exports.config.useragent){
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
            'User-Agent': exports.config.useragent,
            'Authorization': 'token ' + exports.config.apikey
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
exports.console.register = function(cmdname, eventname){
    if(exports.config.debug){
        console.log('Console: ' + cmdname + ', Event: ' + eventname);
    }
    if(exports.console[cmdname]){
        console.log(cmdname + ' already exists');
        return;
    }
    exports.console[cmdname] = {
        'cmd': cmdname,
        'event': eventname
    };
};
exports.console.unregister = function(cmdname){
    if(!exports.console[cmdname]){
        console.log(cmdname + " doesn't exist");
    }
    else{
        delete exports.console[cmdname];
    }
};
exports.event = new EventEmitter();
//</editor-fold>

//<editor-fold desc='Config loading'>
exports.config.loadConfig = function(filename, callback){
    if(fs.existsSync(exports.rundir + '/configs/' + filename)){
        if(require.cache[exports.rundir + '/configs/' + filename]){
            delete require.cache[exports.rundir + '/configs/' + filename];
        }
        callback(require(exports.rundir + '/configs/' + filename), null);
    }
    else{
        callback({}, 'No file');
    }
};

exports.config.loadSyncConfig = function(filename){
    var callback = {};
    if(fs.existsSync(exports.rundir + '/configs/' + filename)){
        if(require.cache[exports.rundir + '/configs/' + filename]){
            delete require.cache[exports.rundir + '/configs/' + filename];
        }
        return require(exports.rundir + '/configs/' + filename);
    }
    else{
        return 'nofile';
    }
};

exports.config.saveConfig = function(filename, data, callback){
    fs.writeFileSync(exports.rundir + '/configs/' + filename, JSON.stringify(data));
};
//</editor-fold>

//<editor-fold desc='Event Listeners'>
stdin.on('data', function(chunk) {
    console.log('This function is not ready yet');
    //var message = chunk.toString().substring(0 , chunk.toString().length - 1);
    //var command = message.split(' ')[0];
    //console.log(message);
    //if(command == null){
    //    return;
    //}
    //if(exports.console[command]){
    //    exports.event.emit(exports.console[command]['event'], message);
    //}
    //else {
    //    console.log('No Command by that name');
    //}
});

process.on('uncaughtException', function(err) {
    if(exports.config.crash_on_error){
        console.log(err.stack);
        process.kill(process.pid, 'SIGINT');
    }
    else{
        console.log(err.stack);
    }
});

process.on('SIGINT', function () {
    console.log( 'Gracefully shutting down from  SIGINT (Crtl-C)' );
    exports.event.emit('appStopping');
    setTimeout(function(){
        process.exit();
    }, 1000000);
    console.log('Please wait for config saving to complete');
    process.exit();
});

process.on('exit', function(){
    console.log('Good Bye!');
});

exports.event.on('loadConfig', function(filename, eventname){
   exports.config.loadConfig(filename, function(file){
       exports.event.emit(eventname, file);
   });
});

exports.event.on('saveConfig', function(filename, data, eventname){
   exports.config.saveConfig(filename, data, function(err){
       if(err){
           throw err;
       }
       exports.event.emit(eventname, err);
   })
});
//</editor-fold>

//<editor-fold desc='Load Main Config'>
console.log('Minecraft IRC Watcher');
console.log('Reading config');
var config = {};
exports.config.loadConfig('config.json', function(file, err){
    if(err){
        console.log('config.json must exist for the application to run');
        throw 'Missing Config'
    }
    config = file;
});
exports.config.allowall = config['basic']['allow-anyone'];
exports.config.allowedusers = config['basic']['allowed-list'];
exports.config.apikey = config['basic']['github-api-key'];
exports.config.useragent = config['basic']['github-user-agent'];
exports.config.autoupload = config['basic']['auto-upload-crash'];
exports.config.crashmessage = config['basic']['crash-message'];
exports.config.allowcommands = config['basic']['custom-commands'];
exports.config.debug = config['basic']['debug'];
exports.config.crash_on_error = config['basic']['crash-on-error'];
exports.config.irc = config['irc'];
//</editor-fold>

//<editor-fold desc='Load External files'>
var java = require('./lib/java.js');
var modules = require('./lib/modules.js');
var irc = require('./lib/irc.js');
//</editor-fold>

//<editor-fold desc='Run startup'>
console.log('Joining IRC');
irc.newServer(config['irc']);

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

for(var a in config['servers']){
    exports.servers[a] = config['servers'][a];
    exports.servers[a]['name'] = a;
    exports.servers[a]['state'] = 'Offline';
    if(!fs.existsSync('./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory'])){
        console.error('No directory. ./servers/' + exports.servers[a]['name'] + '/' + exports.servers[a]['directory']);
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
                        irc.sayToAll(exports.config.crashmessage);
                        if (exports.config.autoupload) {
							if(exports.config.debug){
								console.log('Uploading crash report to github');
							}
                            exports.servers.putCrash(crash, filename, function (url) {
                                irc.sayToAll('Crash Report at: ' + url);
                            });
                        }
                    }
                }
            }
        }
    });
}
//</editor-fold>