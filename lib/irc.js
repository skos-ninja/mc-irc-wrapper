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
        if(message.toString().substring(0, 7) == '!config'){
            if(files.allowall) {
                if(message.toString().substring(8) == 'reload'){
                    files.reload(function(done){
                        server.say(to, 'Config reload complete!');
                    });
                }
                else if(message.toString().substring(8) == 'save'){
                    files.save(function(done){
                        server.say(to, 'Config Saved!');
                    });
                }
                else{
                    server.say(to, "Usage: !config <reload|save>");
                }
                return;
            }
            else {
                authorized(from, function (data) {
                    if(data == 'user'){
                        if(message.toString().substring(8) == 'reload'){
                            console.log('Config Reload');
                            files.reload(function(done){
                                server.say(to, 'Config reload complete!');
                            });
                        }
                        else if(message.toString().substring(8) == 'save'){
                            files.save(function(done){
                                server.say(to, 'Config Saved!');
                            });
                        }
                        else{
                            server.say(to, "Usage: !config <reload|save>");
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
        if(message.toString().substring(0, 10) == '!allowadd '){
            authorized(from, function(data) {
                if(data == 'user'){
                    if(files.allowedusers[message.toString().substring(9)]){
                        server.say(to, message.toString().substring(9) + ' is already on the allowed list!');
                    }
                    files.allowedusers.push(message.toString().substring(9));
                    server.say(to, message.toString().substring(9) + ' has been added to the allowed list. You must save the config for the changes to be kept!');
                }
                else if(data == 'nologin'){
                    server.say(to, 'You must be logged in to perform this command');
                    return;
                }
                else{
                    server.say(to, 'You are not allowed to perform this command');
                    return;
                }
            })
        }
        if(message.toString().substring(0, 9) == '!allowrm '){
            authorized(from, function(data) {
                if(data == 'user'){
                    if(!files.allowedusers[message.toString().substring(9)]){
                        server.say(to, message.toString().substring(9) + ' is not on the allowed list!');
                        return;
                    }
                    delete files.allowedusers[message.toString().substring(9)];
                    server.say(to, message.toString().substring(9) + ' has been removed from the allowed list. You must save the config for the changes to be kept!');
                }
                else if(data == 'nologin'){
                    server.say(to, 'You must be logged in to perform this command');
                    return;
                }
                else{
                    server.say(to, 'You are not allowed to perform this command');
                    return;
                }
            })
        }
        if(message.toString().substring(0, 7) == '!addcmd'){
            if(message.toString() == '!addcmd'){
                server.say(to, "Currently only supports basic commands. Usage: !addcmd <cmdname> <all> <message>");
            }
            else {
                var cmdname = message.toString().substring(8).split(' ')[0];
                var all = message.toString().substring(8).split(' ')[1];
                if(!all){
                    server.say(to, "Currently only supports basic commands. Usage: !addcmd <cmdname> <all> <message>");
                    return;
                }
                var output = message.toString().substring(10 + cmdname.length + all.length);
                if(output == ''){
                    server.say(to, "Currently only supports basic commands. Usage: !addcmd <cmdname> <all> <message>");
                }
                if(all != 'true' && all != 'false'){
                    server.say(to, 'Invalid all option. All should either be true or false.');
                    return;
                }
                if(files.commands[cmdname]){
                    server.say(to, 'A command already exists by that name!');
                    return;
                }
                if (files.allowall) {
                    files.commands[cmdname] = {
                        output: output,
                        all: all
                    };
                    files.saveCommands();
                    server.say(to, 'Command added!');
                }
                else{
                    authorized(from, function (data) {
                        if (data == 'user') {
                            files.commands[cmdname] = {
                                output: output,
                                all: all
                            };
                            files.saveCommands();
                            server.say(to, 'Command added!');
                        }
                        else if (data == 'nouser') {
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
        }
        if(message.toString().substring(0, 8) == '!editcmd'){
            if(message.toString() == '!editcmd'){
                server.say(to, "Currently only supports basic commands. Usage: !editcmd <cmdname> <all> <message>");
            }
            else{
                var cmdname = message.toString().substring(9).split(' ')[0];
                var all = message.toString().substring(9).split(' ')[1];
                if(!all){
                    server.say(to, "Currently only supports basic commands. Usage: !editcmd <cmdname> <all> <message>");
                    return;
                }
                var output = message.toString().substring(11 + cmdname.length + all.length);
                if(all != 'true' && all != 'false'){
                    server.say(to, 'Invalid all option. All should either be true or false.');
                    return;
                }
                if(!files.commands[cmdname]){
                    server.say(to, 'No command by that name.');
                    return
                }
                if (files.allowall) {
                    files.commands[cmdname] = {
                        output: output,
                        all: all
                    };
                    files.saveCommands();
                    server.say(to, 'Command edited!');
                }
                else{
                    authorized(from, function (data) {
                        if (data == 'user') {
                            files.commands[cmdname] = {
                                output: output,
                                all: all
                            };
                            files.saveCommands();
                            server.say(to, 'Command edited!');
                        }
                        else if (data == 'nouser') {
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
        }
        if(message.toString().substring(0, 7) == "!delcmd"){
            if(message.toString() == '!delcmd'){
                server.say(to, "Usage: !delcmd <cmdname>");
            }
            else{
                var cmdname = message.toString().substring(8).split(' ')[0];
                if(message.toString().substring(8).split(' ')[1]){
                    server.say(to, "Usage: !delcmd <cmdname>");
                    return;
                }
                if(!files.commands[cmdname]){
                    server.say(to, 'No command by the name of ' + cmdname);
                    return;
                }
                if (files.allowall) {
                    delete files.commands[cmdname];
                    files.saveCommands();
                    server.say(to, 'Command deleted!');
                }
                else{
                    authorized(from, function (data) {
                        if (data == 'user') {
                            delete files.commands[cmdname];
                            files.saveCommands();
                            server.say(to, 'Command deleted!');
                        }
                        else if (data == 'nouser') {
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
        }
        if(message.toString() == '!allowadd'){
            server.say(to, "Usage: !allowadd <user>");
        }
        if(message.toString() == '!allowrm'){
            server.say(to, "Usage: !allowrm <user>");
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
                server.say(to, 'Bot Commands are: !summon, !kill, !restart, !addcmd, !editcmd, !delcmd, !allowadd, !allowrm');
            }
            server.say(to, 'Bot Commands are: !summon, !kill, !restart, !addcmd, !editcmd, !delcmd, !allowadd, !allowrm, ' + string);
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

exports.deleteServer = function (){
    server.disconnect("He's Dead Jim!", function(){
    });
};
