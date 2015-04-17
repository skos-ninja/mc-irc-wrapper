var irc = require('irc');
var files = require('./files.js');
var java = require('./java.js');
var server = undefined;

function authorized(from, callback){
    server.whois(from, function(whois) {
        if(!whois['account']){
            callback('nologin');
            return;
        }
        for (var a in files.allowedusers){
            if(files.allowedusers[a] == whois['account']){
                callback('user');
                return;
            }
        }
        callback('nouser')
    });
}

exports.newServer = function (obj) {
    server = new irc.Client(obj['host'], obj['username'], {
        userName: obj['username'],
        channels: obj['channels'],
        debug: obj['debug'],
        password: obj['password']
    });
    exports.sayToAll = function(message){
        for(var a in obj['channels']){
            server.say(a, message);
        }
    };
    server.addListener('message#', function(from, to , message) {
        if(message.toString().substring(0, 8) == "!summon "){
            if(files.allowall) {
                var java_server = message.toString().substring(8);
                if (!files.servers[java_server]) {
                    server.say(to, 'No Server by the name of ' + java_server);
                }
                else {
                    server.say(to, 'Summoning ' + java_server);
                    java.javaSpawn(files.servers[java_server], function (err) {
                        if (err) {
                            server.say(to, 'Server is already running!');
                        }
                    });
                }
                return;
            }
            else {
                authorized(from, function (data) {
                    if(data == 'user'){
                        var java_server = message.toString().substring(8);
                        if (!files.servers[java_server]) {
                            server.say(to, 'No Server by the name of ' + java_server);
                        }
                        else {
                            server.say(to, 'Summoning ' + java_server);
                            java.javaSpawn(files.servers[java_server], function (err) {
                                if (err) {
                                    server.say(to, 'Server is already running!');
                                }
                            });
                        }
                        return;
                    }
                    else if(data == 'nologin'){
                        server.say(to, 'You must be logged in to perform this command');
                        return;
                    }
                    else{
                        server.say(to, 'You are not allowed to perform this command');
                        return;
                    }
                });
            }
        }
        if(message.toString().substring(0, 6) == "!kill ") {
            if (files.allowall) {
                var java_server = message.toString().substring(6);
                if (!files.servers[java_server]) {
                    server.say(to, 'No Server by the name of ' + java_server);
                }
                else {
                    server.say(to, 'Killing ' + java_server);
                    java.javaKill(files.servers[java_server], function (err) {
                        if (err) {
                            server.say(to, java_server + ' is not running!');
                        }
                    });
                }
                return;
            }
            else {
                authorized(from, function (data) {
                    if (data == 'user') {
                        var java_server = message.toString().substring(6);
                        if (!files.servers[java_server]) {
                            server.say(to, 'No Server by the name of ' + java_server);
                        }
                        else {
                            server.say(to, 'Killing ' + java_server);
                            java.javaKill(files.servers[java_server], function (err) {
                                if (err) {
                                    server.say(to, java_server + ' is not running!');
                                }
                            });
                        }
                        return;
                    }
                    else if (data == 'nologin') {
                        server.say(to, 'You must be logged in to perform this command');
                        return;
                    }
                    else {
                        server.say(to, 'You are not allowed to perform this command');
                        return;
                    }
                })
            }
        }
        if(message.toString().substring(0, 9) == "!restart "){
            if(files.allowall){
                var java_server = message.toString().substring(9);
                if(!files.servers[java_server]){
                    server.say(to, 'No Server by the name of ' + java_server);
                }
                else {
                    server.say(to, 'Restarting ' + java_server);
                    java.javaRespawn(files.servers[java_server], function(err) {
                        if(err){
                        }
                    });
                }
                return;
            }
            else{
                authorized(from, function(data) {
                    if(data == 'user'){
                        var java_server = message.toString().substring(9);
                        if(!files.servers[java_server]){
                            server.say(to, 'No Server by the name of ' + java_server);
                        }
                        else {
                            server.say(to, 'Restarting ' + java_server);
                            java.javaRespawn(files.servers[java_server], function(err) {
                                if(err){
                                }
                            });
                        }
                        return;
                    }
                    else if(data == 'nologin'){
                        server.say(to, 'You must be logged in to perform this command');
                        return;
                    }
                    else {
                        server.say(to, 'You are not allowed to perform this command');
                        return;
                    }
                });
            }
        }
        if(message.toString() == '!help'){
            var string = "";
            var i = 0;
            for (var a in files.commands){
                i++;
                if(i == Object.keys(files.commands).length){
                    string = string.toString() + a.toString();
                }
                else {
                    string = string.toString() + a.toString() + ', ';
                }
            }
            if(string == ""){
                server.say(to, 'Bot Commands are: !summon, !kill, !restart');
            }
            server.say(to, 'Bot Commands are: !summon, !kill, !restart, ' + string);
        }
        if(message.toString() == '!servers'){
            var string = "";
            var i = 0;
            for (var a in files.servers){
                i++;
                if(i == Object.keys(files.servers).length){
                    string = string.toString() + a.toString();
                }
                else{
                    string = string.toString() + a.toString() + ', ';
                }
            }
            server.say(to, 'The current servers are: ' + string);
        }
        if(message.toString() == "!addcmd"){
            server.say(to, 'Not implemented yet!');
        }
        if(message.toString() == "!editcmd"){
            server.say(to, 'Not implemented yet!');
        }
        if(message.toString() == "!delcmd"){
            server.say(to, 'Not implemented yet!');
        }
        for(var a in files.commands){
            if(message.toString().substring(0, a.toString().length) == a.toString()){
                if(files.commands[a]['all']){
                    server.say(to, files.commands[a]['output']);
                    return;
                }
                else{
                    authorized(from, function(data) {
                        if(data == 'user'){
                            server.say(to, files.commands[a]['output']);
                            return;
                        }
                        else if(data == 'nologin'){
                            server.say(to, 'You must be logged in to perform this command');
                            return;
                        }
                        else{
                            server.say(to, 'You are not allowed to perform this command');
                            return;
                        }
                    });
                }
            }
        }
    });
};

