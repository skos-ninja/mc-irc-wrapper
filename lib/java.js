var app = require('../app.js');
var irc = require('./irc.js');
var spawn = require('child_process').spawn;
var fs = require('fs');
var javas = {};
var tail = {};

exports.javaSpawn = function(obj, callback){
    fs.exists('./pid/' + obj['name'], function(exists) {
       if(exists == true){
           console.log('Java Process exists');
           callback(true);
       }
       else {
           console.log('No Java Process, Spawning server');
           javas[obj['name']] = spawn('java', ['-Xms' + obj['minram'], '-Xmx' + obj['maxram'], '-jar', obj['jar'], 'nogui'], {
               detached: true,
               cwd: './servers/' + obj['name'] + '/' + obj['directory']
           });
           javas[obj['name']].name = obj['name'];
           app.event.emit('serverStarted', obj['name']);
           fs.writeFileSync('./pid/' + obj['name'], javas[obj['name']].pid);
           javas[obj['name']].stdout.name = obj['name'];
           javas[obj['name']].stdout.on('data', function (data) {
               if (app.config.debug) {
                   if (data != 0) {
                       console.log(this.name + ': ' + data);
                   }
               }
               if (data != 0) {
                   javas[this.name].emit('console', data);
               }
           });
           javas[obj['name']].stderr.on('data', function (data) {
               if (app.config.debug) {
                   console.log('stderr: ' + data);
               }
           });
           javas[obj['name']].on('close', function (code) {
               try {
                   fs.unlinkSync('./pid/' + obj['name']);
               }
               catch (e) {
               }
               app.event.emit('serverStopped', obj['name']);
               delete javas[obj['name']];
           });
           for(var a in tail){
               if(tail[a][obj['name']]){
                   tail[a][obj['name']] = javas[obj['name']].on('console', function (console) {
                       irc.sayTo(this.user, console);
                   });
                   tail[a][obj['name']].user = a;
                   tail[a][obj['name']].server = obj['name'];
               }
           }
       }
           callback(false);
    });
};

exports.javaStop = function(obj, callback){
    if(!javas[obj['name']]){
        callback('Unable to stop, the server may not be running or due to no child object. Please restart from within the server or !kill', false);
    }
    else{
        javas[obj['name']].stdin.setEncoding('utf-8');
        javas[obj['name']].stdin.write("save-all\n");
        javas[obj['name']].stdin.write("stop\n");
    }
    
};

exports.javaKill = function(obj, callback){
    fs.exists('./pid/' + obj['name'], function(exists) {
       if(exists == true){
           console.log('Killing Server');
           if(javas[obj['name']]){
               try{
                   javas[obj['name']].kill('SIGHUP');
               }
               catch (e){
               }
           }
           else{
               try{
                   process.kill(fs.readFileSync('./pid/' + obj['name'], 'utf8'), 'SIGINT');
               }
               catch (e){
                   console.log(e);
                   callback(true);
               }
           }
           try{
               fs.unlinkSync('./pid/' + obj['name']);
           }
           catch (e){}
       }
       else {
           console.log('No Process to kill!');
           callback(true);
       }
    });
};

exports.javaRespawn = function(obj, callback){
    fs.exists('./pid/' + obj['name'], function(exists) {
        if(exists == true){
            exports.javaStop(obj, function(err){
                if(err){
                    exports.javaKill(obj, function(err){

                    });
                }
                exports.javaSpawn(obj, function(err){

                });
            });
        }
        else {
            exports.javaSpawn(obj, function(err){

            });
        }
    });
    callback(true)
};

exports.javaTail = function(obj, user, callback) {
    if (!tail[user]){
        tail[user] = {};
    }
    if (!javas[obj['name']]) {
        tail[user][obj['name']] = {};
        callback('You are now tailing the server. Output will begin when the server is started', false);
        return;
    }
    if (!tail[user][obj['name']]) {
        tail[user][obj['name']] = javas[obj['name']].on('console', function (console) {
            irc.sayTo(this.user, console);
        });
        tail[user][obj['name']].user = user;
        tail[user][obj['name']].server = obj['name'];
        callback('You are now tailing the server');
    }
    else{
        callback('You are already tailing the server.', false);
    }
};

exports.javaTailStop = function(obj, user, callback){
    if(!javas[obj['name']]){
        callback('Can not stop tailing. No server by that name', false);
        return;
    }
    if(!tail[user][obj['name']]){
        callback('You are not tailing this server.', false);
        return;
    }
    if(tail[user][obj['name']] == {}){
        callback('You are no longer tailing this server.', false);
        delete tail[user][obj['name']];
        return;
    }
    delete tail[user][obj['name']];
    callback('You are no longer tailing this server.', false);
};

app.event.on('serverStart', function(server, channel){
    exports.javaSpawn(app.servers[server], function(err){
        if(err){
            app.event.emit('ircSay', channel, app.servers[server]['friendly-name'] + ' is already running');
        }
        else{
            app.event.emit('ircSay', channel, app.servers[server]['friendly-name'] + ' is starting');
            app.event.emit('serverStarted', server);
        }
    })
});

app.event.on('serverStop', function(server, channel){
    exports.javaStop(app.servers[server], function(response){
        app.event.emit('ircSay', channel, response);
        app.event.emit('serverStopped', server);
    })
});

app.event.on('serverKill', function(server, channel){
    exports.javaKill(app.servers[server], function(err){
        if(err){
            app.event.emit('ircSay', channel, app.servers[server]['friendly-name'] + ' is not running');
        }
        else{
            app.event.emit('ircSay', channel, app.servers[server]['friendly-name'] + ' killed');
        }
    })
});

app.event.on('serverRestart', function(server, channel){
    exports.javaRespawn(app.servers[server], function(err){
        if(err){

        }
        app.event.emit('ircSay', channel, app.servers[server]['friendly-name'] + ' is restarting');
    })
});