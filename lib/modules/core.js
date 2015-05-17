var app = require('../../app.js');
var console_commands = {};
var commands = {};
var custom_commands = {};

//Commands functions

//<editor-fold desc='Server Functions'>
function serverStarted(server){
    console.log(server + ' is now online');
    app.servers[server]['state'] = 'Online';
    app.servers[server]['starttime'] = new Date();
}

function serverStopped(server){
    console.log(server + ' is now offline');
    app.servers[server]['state'] = 'Offline';
    app.servers[server]['starttime'] = '';
}

app.event.on('serverStopped', function(server, code){
    serverStopped(server);
});

app.event.on('serverStarted', function(server){
    serverStarted(server);
});
//</editor-fold>

//<editor-fold desc='Help Functions'>
function compileHelp(callback){
    var string = 'Channel Bot Commands are:';

    for(var a in app.commands){
        if(app.commands[a]['displayhelp']){
            string = string + ' ' + app.commands[a]['cmd'];
        }
    }
    callback(string);
}
//</editor-fold>

//<editor-fold desc='Commands Functions'>
function command_create(message, to){
    if(!message.split(' ')[0]){
        app.event.emit('ircSay', to, 'Usage: !commands add <command> <true|false> <output>. True or false determines if the server shall allow all users to run the command');
        return;
    }
    if(!message.split(' ')[1]){
        app.event.emit('ircSay', to, 'Usage: !commands add <command> <true|false> <output>. True or false determines if the server shall allow all users to run the command');
        return;
    }
    if(!message.split(' ')[2]){
        app.event.emit('ircSay', to, 'Usage: !commands add <command> <true|false> <output>. True or false determines if the server shall allow all users to run the command');
        return;
    }
    if(app.commands[message.split(' ')[0]]){
        app.event.emit('ircSay', to, 'This command already exists!');
        return;
    }
    var output = message.substring(message.split(' ')[0] + message.split(' ')[1] + message.split(' ')[2] + 3);
    custom_commands[message.split(' ')[0]] = {
        'cmd': message.split(' ')[0],
        'all': message.split(' ')[1],
        'output': message.split(' ')[2],
        'run': 0
    };
    app.commands.register(message.split(' ')[0], 'module_core_custom', true, message.split(' ')[2]);
    app.config.saveConfig('commands.json', custom_commands);
}

function command_remove(message, to){
    if(!message.split(' ')[0]){
        app.event.emit('ircSay', to, 'Usage: !commands remove <command>');
        return;
    }
    if(app.commands[message.split(' ')[0]]) {
        if(!custom_commands[message.split(' ')[0]]) {
            app.event.emit('ircSay', to, 'This is not a custom command so can not be deleted');
            return;
        }
        delete custom_commands[message.split(' ')[0]];
        app.commands.unregister(message.split(' ')[0]);
    }
    else{
        app.event.emit('ircSay', to, 'No command by that name');
    }
}

function command_edit(message, to){
    if(!message.split(' ')[1]){
        app.event.emit('ircSay', to, 'Usage: !commands edit <command> <true|false> <output>. True or false determines if the server shall allow all users to run the command');
        return;
    }
    if(!app.commands[message.split(' ')[0]]){
        app.event.emit('ircSay', to, 'No command by that name');
        return;
    }
    custom_commands[message.split(' ')[0]] = {
        'cmd': message.split(' ')[0],
        'all': message.split(' ')[1],
        'output': message.substring(message.split(' ')[0].length + message.split(' ')[1].length + 2),
        'run': custom_commands[message.split(' ')[0]]['run']
    };
    app.event.emit('ircSay', to, 'Command edited');
}

function command_proccessor(command, from, to){
    var user = from;
    var target = command.split(' ')[1];
    var runcount = custom_commands[command.split(' ')[0]]['run'] + 1;
    var output = custom_commands[command.split(' ')[0]]['output'].replace('_user_', user).replace('_target_', target).replace('_run_', runcount);
    app.event.emit('ircSay', to, output);
}

app.event.on('module_core_custom', function(message, from, to){
    var command = message.split(' ')[0];
    if(app.commands[command]){
        if(custom_commands[command]['all'] == 'false'){
            app.irc.authorized(from, function(result){
               switch (result) {
                   case 'nologin':
                       app.event.emit('ircSay', to, 'You must be logged in to perform this command');
                       break;

                   case 'nouser':
                       app.event.emit('ircSay', to, 'You are not allowed to perform this command');
                       break;

                   default:
                       command_proccessor(message, from, to);
                       break;
               }
            });
        }
        else{
            command_proccessor(message, from, to);
        }
    }
});
//</editor-fold>

//IRC Commands

//<editor-fold desc='!help command'>
commands['help'] = {};
commands['help']['cmd'] = '!help';
commands['help']['event'] = 'module_core_help';
commands['help']['displayhelp'] = false;
commands['help']['helpdesc'] = 'Usage: !help <command (Optional)>';
app.event.on(commands['help']['event'], function(message, from, to){
    var command = message.split(' ')[0];
    var commandhelp = message.split(' ')[1];
    if(message.split(' ')[2]){
        app.event.emit('ircSay', to, commands['help']['helpdesc']);
        return;
    }
    if(commandhelp){
        if(!app.commands[commandhelp]){
            app.event.emit('ircSay', to, 'No command by that name');
            return
        }
        if(app.commands[commandhelp]['helpdesc']){
            app.event.emit('ircSay', to, app.commands[commandhelp]['helpdesc']);
        }
        else{
            app.event.emit('ircSay', to, 'This command does not have a help, please ask the author to add a help description');
        }
    }
    else{
        compileHelp(function(string){
            app.event.emit('ircSay', to, string);
        })
    }
});
//</editor-fold>

//<editor-fold desc='!debug|!ping command'>
    if(app.config.debug){
        commands['debug'] = {};
        commands['debug']['cmd'] = '!debug';
        commands['debug']['event'] = 'module_core_debug';
        commands['debug']['displayhelp'] = false;
        commands['debug']['helpdesc'] = 'Usage: !debug';
        app.event.on(commands['debug']['event'], function(message, from, to){
           var command = message.split(' ')[0];
            if(command != commands['debug']['cmd']){
                return;
            }
            if(message.split(' ')[1]){
                app.event.emit('ircSay', to, commands['debug']['helpdesc']);
                return;
            }
            console.log('Debug: app.commands = ' + util.inspect(app.commands));
            console.log('Debug: app.modules = ' + util.inspect(app.modules));
            console.log('Debug: app.config = ' + util.inspect(app.config));
        });

        commands['ping'] = {};
        commands['ping']['cmd'] = '!ping';
        commands['ping']['event'] = 'module_core_ping';
        commands['ping']['displayhelp'] = false;
        commands['ping']['helpdesc'] = 'Usage: !ping';
        app.event.on(commands['ping']['event'], function(message, from, to){
            console.log('Debug: !ping from ' + from);
            app.event.emit('ircSay', to, 'PONG');
        })
    }
//</editor-fold>

//<editor-fold desc='!uptime command'>
commands['uptime'] = {};
commands['uptime']['cmd'] = '!uptime';
commands['uptime']['event'] = 'module_core_uptime';
commands['uptime']['displayhelp'] = true;
commands['uptime']['helpdesc'] = 'Usage: !uptime <server (Optional)>. This will display the uptime of the bot or the server';
app.event.on(commands['uptime']['event'], function(message, from, to){
    var command = message.split(' ')[0];
    var server = message.split(' ')[1];
    if(command != commands['uptime']['cmd']){
        return;
    }
    if(message.split(' ')[3]){
        app.event.emit('ircSay', to, commands['uptime']['helpdesc']);
        return
    }
    if(!server){
        app.event.emit('ircSay', to, 'The bot has been up for: ' + app.uptime(process.uptime()));
    }
    else {
        if (app.servers[server]) {
            if (app.servers[server]['state'] == 'Offline') {
                app.event.emit('ircSay', to, app.servers[server]['friendly-name'] + ' is currently down.');
                return;
            }
            var time = new Date() - app.servers[server]['starttime'];
            app.event.emit('ircSay', to, app.servers[server]['friendly-name'] + ' has been up for: ' + app.uptime(time));
        }
        else{
            app.event.emit('ircSay', to, 'No server by the name of ' + server);
        }
    }
});
//</editor-fold>

//<editor-fold desc='!user command'>
commands['user'] = {};
commands['user']['cmd'] = '!user';
commands['user']['event'] = 'module_core_user';
commands['user']['displayhelp'] = true;
commands['user']['helpdesc'] = 'Usage: !user <add|remove|list> <username>. This will add and remove users from the trusted list';
app.event.on(commands['user']['event'], function(message, from, to){
    var command = message.split(' ')[0];
    var modifier = message.split(' ')[1];
    var user = message.split(' ')[2];
    if(message.split(' ')[3]){
        app.event.emit('ircSay', to, commands['user']['helpdesc']);
        return;
    }
    if(commands['user']['cmd'])
    app.irc.authorized(from, function(result){
       switch (result) {
           case 'nologin':
               app.event.emit('ircSay', to, 'You must be logged in to perform this command');
               break;
           case 'nouser':
               app.event.emit('ircSay', to, 'You are not allowed to perform this command');
               break;

           default:
               if (!modifier) {
                   app.event.emit('ircSay', to, commands['user']['helpdesc']);
                   break;
               }
               if(modifier != 'list') {
                   if (!user) {
                       app.event.emit('ircSay', to, commands['user']['helpdesc']);
                       break;
                   }
               }
               switch (modifier) {
                   case 'add':
                       app.irc.whois(user, function(whois){
                          if(!whois['account']){
                              app.event.emit('ircSay', to, 'User is not logged in');
                              return;
                          }
                          else{
                              var exists = false;
                              for(var a in app.config.allowedusers){
                                  if(app.config.allowedusers[a] == whois['account']) {
                                      app.event.emit('ircSay', to, 'User is already allowed');
                                      exists = true;
                                      break;
                                  }
                              }
                              if(!exists){
                                  app.config.allowedusers.push(user);
                                  app.event.emit('ircSay', to, 'User added to the allowed list');
                              }
                          }
                       });
                       break;
                   case 'remove':
                       app.irc.whois(user, function(whois){
                           if(!whois['account']){
                               app.event.emit('ircSay', to, 'User is not logged in');
                               return;
                           }
                           else{
                               var exists = false;
                               for (var a in app.config.allowedusers) {
                                   if (app.config.allowedusers[a] == user) {
                                       delete app.config.allowedusers[a];
                                       app.event.emit('ircSay', to, 'User has been removed from the allowed list');
                                       exists = true;
                                       break;
                                   }
                               }
                               if(!exists){
                                   app.event.emit('ircSay', to, 'User is not in the allowed list');
                               }
                           }
                       });
                       break;

                   case 'list':
                       var string = 'The users allowed are:';
                       for(var a in app.config.allowedusers){
                           string = string + ' ' + app.config.allowedusers[a];
                       }
                       app.event.emit('ircSay', to, string);
                       break;

                   default:
                       app.event.emit('ircSay', to, commands['user']['helpdesc']);
                       break;
               }
               break;
       }
    });
});
//</editor-fold>

//<editor-fold desc='!config command'>
commands['config'] = {};
commands['config']['cmd'] = '!config';
commands['config']['event'] = 'module_core_config';
commands['config']['displayhelp'] = true;
commands['config']['helpdesc'] = 'Usage: !config <save|reload> <config name>';
app.event.on(commands['config']['event'], function(message, from, to){

});
//</editor-fold>

//<editor-fold desc='!commands command'>
commands['commands'] = {};
commands['commands']['cmd'] = '!commands';
commands['commands']['event'] = 'module_core_commands';
commands['commands']['displayhelp'] = true;
commands['commands']['helpdesc'] = 'Usage: !commands <add|remove|edit>. Running the command with the selected arg will display its help';
app.event.on(commands['commands']['event'], function(message, from, to){
    var command = message.split(' ')[0];
    var modifier = message.split(' ')[1];
    var rest = message.substring(command.length + modifier.length + 2);
    if(command != commands['commands']['cmd']){
        return;
    }
    if(!app.config.allowall){
        app.irc.authorized(from, function(result){
            switch (result){
                case 'nologin':
                    app.event.emit('ircSay', to, 'You must be logged in to perform this command');
                    break;
                case 'nouser':
                    app.event.emit('ircSay', to, 'You are not allowed to perform this command');
                    break;

                default :
                    if(!modifier){
                        app.event.emit('ircSay', to, commands['commands']['helpdesc']);
                        break;
                    }
                    switch (modifier){
                        case 'add':
                            command_create(rest, to);
                            break;

                        case 'remove':
                            command_remove(rest, to);
                            break;

                        case 'edit':
                            command_edit(rest, to);
                            break;

                        default:
                            app.event.emit('ircSay', to, commands['commands']['helpdesc']);
                            break;
                    }
                    break;
            }
        })
    }
    else{
        switch (modifier){
            case 'add':
                command_create(rest, to);
                break;

            case 'remove':
                command_remove(rest, to);
                break;

            case 'edit':
                command_edit(rest, to);
                break;

            default:
                app.event.emit('ircSay', to, commands['commands']['helpdesc']);
                break;
        }
    }
});
//</editor-fold>

//<editor-fold desc='!kick command'>
commands['kick'] = {};
commands['kick']['cmd'] = '!kick';
commands['kick']['event'] = 'module_core_kick';
commands['kick']['displayhelp'] = true;
commands['kick']['helpdesc'] = 'Usage: !kick <user> <reason>. The bot must have permissions to kick a user.';
app.event.on(commands['kick']['event'], function(message, from, to){
    app.irc.authorized(from, function(result){
        switch (result) {
            case 'nologin':
                app.event.emit('ircSay', to, 'You must be logged in to perform this command');
                break;
            case 'nouser':
                app.event.emit('ircSay', to, 'You are not allowed to perform this command');
                break;

            default:
                var command = message.split(' ')[0];
                var user = message.split(' ')[1];
                var reason = message.split(' ')[2];
                if(command != commands['kick']['cmd']){
                    break;
                }
                if(message.split(' ')[3]){
                    app.event.emit('ircSay', to, commands['kick']['helpdesc']);
                    break;
                }
                if(!user){
                    app.event.emit('ircSay', to, commands['kick']['helpdesc']);
                    break;
                }
                if(!reason){
                    reason =  from + ' has kicked you, no reason given';
                }
                app.event.emit('ircKick', to, user, reason);
                app.event.emit('ircSay', to, from + ' has kicked ' + user + '. Reason: ' + reason);
                break;
        }
    });
});
//</editor-fold>

//<editor-fold desc='!unban command'>
commands['unban'] = {};
commands['unban']['cmd'] = '!unban';
commands['unban']['event'] = 'module_core_unban';
commands['unban']['displayhelp'] = true;
commands['unban']['helpdesc'] = 'Usage: !unban <user> <reason>. The bot must have permissions to unban a user.';
app.event.on(commands['unban']['event'], function(message, from, to){
    app.irc.authorized(from, function(result){
       switch (result) {
           case 'nologin':
               app.event.emit('ircSay', to, 'You must be logged in to perform this command');
               break;
           case 'nouser':
               app.event.emit('ircSay', to, 'You are not allowed to perform this command');
               break;
           default:
               var command = message.split(' ')[0];
               var user = message.split(' ')[1];
               if(command != commands['unban']['cmd']){
                   break;
               }
               if(message.split(' ')[2]){
                   app.event.emit('ircSay', to, commands['unban']['helpdesc']);
                   break;
               }
               if(!user){
                   app.event.emit('ircSay', to, commands['unban']['helpdesc']);
                   break;
               }
               app.event.emit('ircUnBan', to, user);
               app.event.emit('ircSay', to, from + ' has unbanned ' + user);
               break;
       }
    });
});
//</editor-fold>

//<editor-fold desc='!ban command'>
commands['ban'] = {};
commands['ban']['cmd'] = '!ban';
commands['ban']['event'] = 'module_core_ban';
commands['ban']['displayhelp'] = true;
commands['ban']['helpdesc'] = 'Usage: !ban <user> <reason>. The bot must have permissions to ban a user.';
app.event.on(commands['ban']['event'], function(message, from, to){
    app.irc.authorized(from, function(result){
        switch (result) {
            case 'nologin':
                app.event.emit('ircSay', to, 'You must be logged in to perform this command');
                break;
            case 'nouser':
                app.event.emit('ircSay', to, 'You are not allowed to perform this command');
                break;
            default:
                var command = message.split(' ')[0];
                var user = message.split(' ')[1];
                var reason = message.split(' ')[2];
                if(command != commands['ban']['cmd']){
                    return;
                }
                if(message.split(' ')[3]){
                    app.event.emit('ircSay', to, commands['ban']['helpdesc']);
                    return;
                }
                if(!user){
                    app.event.emit('ircSay', to, commands['ban']['helpdesc']);
                    return;
                }
                if(!reason){
                    reason =  from + ' has banned you, no reason given';
                }
                app.event.emit('ircBan', to, user, reason);
                app.event.emit('ircSay', to, from + ' has banned ' + user + '. Reason: ' + reason);
                break;
        }
    });
});
//</editor-fold>

//<editor-fold desc='!servers command'>
commands['servers'] = {};
commands['servers']['cmd'] = '!servers';
commands['servers']['event'] = 'module_core_servers';
commands['servers']['displayhelp'] = true;
commands['servers']['helpdesc'] = 'Usage: !servers <servers> <start|stop|restart|kill>. Running !servers will give you a list of the servers. This allows for the starting, stopping and restarting of Minecraft servers.';
app.event.on(commands['servers']['event'], function(message, from, to){
    if(app.config.allowall == false){
        app.irc.authorized(from, function(result){
            switch (result){
                case 'nologin':
                    app.event.emit('ircSay', to, 'You must be logged in to perform this command');
                    break;
                case 'nouser':
                    app.event.emit('ircSay', to, 'You are not allowed to perform this command');
                    break;
                default:
                    var command = message.split(' ')[0];
                    var server = message.split(' ')[1];
                    var arg = message.split(' ')[2];
                    if(message.split(' ')[3]){
                        app.event.emit('ircSay', to, commands['servers']['helpdesc']);
                        break;
                    }
                    if(command != commands['servers']['cmd']){
                        break;
                    }
                    if(!server){
                        var string = '';
                        for(var a in app.servers){
                            console.log(app.servers[a]);
                            if(app.servers[a]['friendly-name']) {
                                if (!app.servers[a]['state']) {
                                    app.servers[a]['state'] = 'Offline';
                                }
                                string = string + ' ' + app.servers[a]['friendly-name'] + '|' + app.servers[a]['state'];
                            }
                        }
                        app.event.emit('ircSay', to, 'The current servers are: ' + string);
                        return;
                    }
                    if(!app.servers[server]){
                        var string = '';
                        for(var a in app.servers){
                            console.log(app.servers[a]);
                            if(!app.servers[a]['state']){
                                app.servers[a]['state'] = 'Offline';
                            }
                            string = string + ' ' + app.servers[a]['friendly-name'] + '|' + app.servers[a]['state'];
                        }
                        app.event.emit('ircSay', to, 'The current servers are: ' + string);
                        break;
                    }
                    switch (arg){
                        case 'start':
                            app.event.emit('serverStart', server, to);
                            break;
                        case 'stop':
                            app.event.emit('serverStop', server, to);
                            break;
                        case 'restart':
                            app.event.emit('serverRestart', server, to);
                            break;
                        case 'kill':
                            app.event.emit('serverKill', server, to);
                            break;
                        default:
                            app.event.emit('ircSay', to, commands['servers']['helpdesc']);
                            break;
                    }
                    break;
            }
        });
    }
});
//</editor-fold>

//Console Commands

//<editor-fold desc='irc command'>
console_commands['irc'] = {
    'cmd': 'irc',
    'event': 'console_irc'
};
app.event.on(console_commands['irc']['event'], function(message){
    if(!console_commands['irc']['cmd'] == message.split(' ')[0]){
        return;
    }
    switch (message.split(' ')[1]){
        case 'connect':
            app.event.emit('ircConnect');
            console.log('Connected to irc');
            break;

        case 'disconnect':
            app.event.emit('ircDisconnect');
            console.log('Disconnected from irc');
            break;

        case 'nick':
            app.event.emit('ircNick', message.split(' ')[2], function(result){
                if(result == 'unable'){
                    console.log('Unable to change nick');
                    return;
                }
                console.log('Nick changed');
            });
            break;

        case 'join':
            app.event.emit('ircJoin', message.split(' ')[2], function(result){
                if(result == 'notachannel'){
                    console.log('Not a channel');
                    return;
                }
                if(result == 'notconnected'){
                    console.log('Not connected to irc');
                    return;
                }
                if(result == 'unable'){
                    console.log('Unable to join channel');
                    return;
                }
                console.log('Joined the channel');
            });
            break;

        case 'part':
            app.event.emit('ircPart', message.split(' ')[2], function(result){
                if(result == 'nochannel'){
                    console.log('Not currently connected to that channel');
                    return;
                }
                if(result == 'notconnected'){
                    console.log('Not connected to irc');
                    return;
                }
                console.log('Parted from the channel');
            });
            break;

        default:
            console.log('Usage: irc <connect|disconnect|nick|join|part> <nickname|channel>');
            break;
    }
});
//</editor-fold>

//<editor-fold desc='servers command'>
console_commands['servers'] = {
    'cmd': 'servers',
    'event': 'console_server',
    'help': 'Usage: servers <servers> <start|stop|restart|kill>. Running servers will give you a list of the servers. This allows for the starting, stopping and restarting of Minecraft servers.'
};
app.event.on(console_commands['servers']['event'], function(message){
    console.log(message);
    var command = message.split(' ')[0];
    console.log(command);
    var server = message.split(' ')[1];
    console.log(server);
    var arg = message.split(' ')[2];
    if(message.split(' ')[3]){
        console.log(console_commands['servers']['help']);
        return;
    }
    if(command != console_commands['servers']['cmd']){
        return;
    }
    if(!server){
        var string = '';
        for(var a in app.servers){
            if(app.servers[a]['friendly-name']) {
                if (!app.servers[a]['state']) {
                    app.servers[a]['state'] = 'Offline';
                }
                string = string + ' ' + app.servers[a]['friendly-name'] + '|' + app.servers[a]['state'];
            }
        }
        console.log('The current servers are: ' + string);
        return;
    }
    if(!app.servers[server]){
        var string = '';
        for(var a in app.servers){
            if(app.servers[a]['friendly-name']) {
                if (!app.servers[a]['state']) {
                    app.servers[a]['state'] = 'Offline';
                }
                string = string + ' ' + app.servers[a]['friendly-name'] + '|' + app.servers[a]['state'];
            }
        }
        console.log('The current servers are: ' + string);
        return;
    }
    switch (arg){
        case 'start':
            app.event.emit('serverStart', server, null);
            break;
        case 'stop':
            app.event.emit('serverStop', server, null);
            break;
        case 'restart':
            app.event.emit('serverRestart', server, null);
            break;
        case 'kill':
            app.event.emit('serverKill', server, null);
            break;
        default:
            console.log(console_commands['servers']['help']);
            break;
    }
});
//</editor-fold>

//<editor-fold desc='Event Listeners'>
app.event.on('module_core_load', function(){
    custom_commands = app.config.loadSyncConfig('commands.json');
    if(custom_commands == 'nofile'){
        custom_commands = {};
        app.config.saveConfig('commands.json', custom_commands);
    }
    for(var a in console_commands){
        app.console.register(console_commands[a]['cmd'], console_commands[a]['event']);
    }
    for(var a in commands){
        app.commands.register(commands[a]['cmd'], commands[a]['event'], commands[a]['displayhelp'], commands[a]['helpdesc']);
    }
    for(var a in custom_commands){
        app.commands.register(custom_commands[a]['cmd'], 'module_core_custom', true, custom_commands[a]['output']);
    }
});

app.event.on('module_core_remove', function(){
    app.config.saveConfig('commands.json', custom_commands);
    for(var a in console_commands){
        app.console.unregister(console_commands[a]['cmd']);
    }
    for(var a in commands){
        app.commands.unregister(commands[a]['cmd']);
    }
    for(var a in custom_commands){
        app.commands.unregister(custom_commands['cmd']);
    }
});

app.event.on('module_core_configSave', function(){
   app.config.saveConfig('commands.json', custom_commands);
});
//</editor-fold>