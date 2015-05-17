var irc = require('irc');
var app = require('../app.js');
var java = require('./java.js');
var server = undefined;

app.irc.authorized = function(from, callback){
    server.whois(from, function(whois) {
        if(!whois['account']){
            callback('nologin');
            return;
        }
        for (var a in app.config.allowedusers){
            if(app.config.allowedusers[a] == whois['account']){
                callback('user');
                return;
            }
        }
        callback('nouser')
    });
};

app.irc.whois = function(nick, callback){
    server.whois(nick, function(whois){
        callback(whois);
    })
};

exports.newServer = function (obj) {
    server = new irc.Client(obj['host'], obj['username'], {
        userName: obj['username'],
        channels: obj['channels'],
        debug: obj['debug'],
        password: obj['password'],
        floodProtection: true
    });
    exports.sayToAll = function(message){
        for(var a in obj['channels']){
            server.say(obj['channels'][a], message);
        }
    };
    exports.sayTo = function(user, message){
        if(!user || !message){
            console.warn('No user or message.');
             throw this;
        }
        else{
            server.say(user, message);
        }
    };
    exports.sayRaw = function(message){
        server.send(message);
    };
    exports.sayAction = function(user, message){
        server.action(user, message);
    };
    exports.kick = function(channel, user, reason){
        server.send('KICK', channel, user, reason);
    };
    exports.ban = function(channel, user, reason){
        server.send('MODE', channel, '+b', user);
        server.send('KICK', channel, user, reason);
    };
    exports.unban = function(channel, user){
        server.send('MODE', channel, '-b', user);
    };
    exports.nick = function(nick){
        server.send('NICK', nick);
    };
    server.addListener('message#', function(from, to, message) {
        var split = message.substr(0,message.indexOf(' '));
        var split_alt = message.substr(message.indexOf(' ')+1);
        if(split == ''){
            if(app.commands[split_alt]){
                app.event.emit(app.commands[split_alt]['event'], message, from, to);
            }
        }
        else{
            if(app.commands[split]){
                app.event.emit(app.commands[split]['event'], message, from, to);
            }
        }
    });
    server.addListener('pm', function(from, message){
        var command = message.split(' ')[0];
        var channel = message.split(' ')[1];
        if(command == 'JOIN'){
            app.irc.authorized(from, function(result){
               switch (result){
                   case 'nologin':
                       server.say(from, 'You must be logged in to run this command');
                       break;

                   case 'nouser':
                       server.say(from, 'You are not allowed to perform this command');
                       break;

                   default:
                       if(!channel){
                           server.say(from, 'Usage: JOIN <channel>');
                           break;
                       }
                       server.join(channel);
                       server.say(from, 'Joining ' + channel);
                       break;
               }
            });
            return;
        }
        if(command == 'PART'){
            app.irc.authorized(from, function(result){
                switch (result){
                    case 'nologin':
                        server.say(from, 'You must be logged in to run this command');
                        break;

                    case 'nouser':
                        server.say(from, 'You are not allowed to perform this command');
                        break;

                    default:
                        if(!channel){
                            server.say(from, 'Usage: PART <channel>');
                            break;
                        }
                        server.part(channel);
                        server.say(from, 'Parting ' + channel);
                        break;
                }
            });
            return;
        }
    })
};

exports.deleteServer = function (){
    server.disconnect("He's Dead Jim!", function(){
    });
};

app.event.on('ircSay', function(channel, message){
    if(app.config.debug){
        console.log(channel + ': ' + message);
    }
    if(server){
        exports.sayTo(channel, message);
    }
});

app.event.on('ircRaw', function(message){
    if(app.config.debug){
        console.log(message);
    }
    if(server){
        exports.sayRaw(message);
    }
});

app.event.on('ircAction', function(channel, message){
    if(app.config.debug){
        console.log(channel + ': ' + message);
    }
    if(server){
        exports.sayAction(channel, message);
    }
});

app.event.on('ircKick', function(channel, user, reason){
   exports.kick(channel, user, reason);
});

app.event.on('ircBan', function(channel, user, reason){
   exports.ban(channel, user, reason);
});

app.event.on('ircUnBan', function(channel, user){
   exports.unban(channel, user);
});

app.event.on('ircDisconnect', function(){
   exports.deleteServer();
});

app.event.on('ircConnect', function(){
    exports.newServer(app.config.irc);
});

app.event.emit('ircNick', function(nick, callback){
    if(!server){
        callback('unable');
        return;
    }
    exports.nick(nick);
    callback('');
});

app.event.on('ircJoin', function(channel, callback){
    if(!server){
        callback('notconnected');
        return;
    }
    if(channel.substring(0,1) != '#'){
        callback('notachannel');
        return;
    }
    server.join(channel);
});

app.event.on('ircPart', function(channel, callback){
    if(!server){
        callback('notconnected');
        return;
    }
    if(channel.substring(0,1) != '#'){
        callback('notachannel');
        return;
    }
    server.part(channel);
});

app.event.on('appStopping', function(){
    exports.deleteServer();
});