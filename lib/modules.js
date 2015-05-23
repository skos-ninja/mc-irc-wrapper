var app = require('../app.js');
var fs = require('fs');
var config = {};

app.commands.register('!module', 'module_cmd');
app.config.loadConfig('modules.json', function(data, err){
    config = data;
});

if(!config['autoload']){
    config['autoload'] = {};
}

app.event.on('module_cmd', function(message, from, to){
    app.irc.authorized(from, function(result){
       switch (result){
           case 'nouser':
               app.event.emit('ircSay', to, 'You are not allowed to perform this command');
               break;

           case 'nologin':
               app.event.emit('ircSay', to, 'You must be logged in to perform this command');
               break;

           default:
               var command = message.split(' ')[0];
               var modifier = message.split(' ')[1];
               var module = message.split(' ')[2];
               if(command != '!module'){
                   return;
               }
               if(modifier != 'list'){
                   if(!module){
                       modifier = '';
                   }
               }
               if(message.split(' ')[3]){
                   modifier = '';
               }
               switch (modifier){
                   case 'load':
                       if(!fs.existsSync(app.rundir + '/lib/modules/' + module + '.js')){
                           app.event.emit('ircSay', to, 'Can not load ' + module + ', it does not exist');
                           return;
                       }
                       if(module == 'core'){
                           app.event.emit('ircSay', to, 'Can not load core, it is always loaded. In the case of an update please use reload');
                           return;
                       }
                       if(app.modules[module]){
                           app.event.emit('ircSay', to, 'Can not load ' + module + ' as it is already loaded');
                           return;
                       }
                       app.event.emit('ircSay', to, 'Loading module ' + module);
                       app.modules[module] = require(app.rundir + '/lib/modules/' + module + '.js');
                       app.event.emit('module_' + module + '_load');
                       break;
                   case 'unload':
                       if(!app.modules[module]){
                           app.event.emit('ircSay', to, 'Can not unload ' + module + ' it is not loaded');
                           return;
                       }
                       if(module == 'core'){
                           app.event.emit('ircSay', to, 'Can not unload the core module. In the case of an update please use reload');
                           return;
                       }
                       app.event.emit('module_' + module + '_remove');
                       app.event.emit('ircSay', to, 'Unloading module ' + module);
                       delete app.modules[module];
                       delete require.cache[app.rundir + '/lib/modules/' + module + '.js'];
                       break;
                   case 'reload':
                       if(!app.modules[module]){
                           app.event.emit('ircSay', to, 'Can not reload ' + module + ' it is not loaded');
                           return;
                       }
                       app.event.emit('ircSay', to, 'Reloading ' + module);
                       app.event.emit('module_' + module + '_reload');
                       delete app.modules[module];
                       delete require.cache[app.rundir + '/lib/modules/' + module + '.js'];
                       app.modules[module] = require(app.rundir + '/lib/modules/' + module + '.js');
                       break;
                   case 'autoload':
                       config['autoload'][module] = true;
                       app.config.saveConfig('modules.json', config, function(err){
                           if(err){
                               throw err;
                               return;
                           }
                       });
                       if(!app.modules[module]){
                           app.modules[module] = require(app.rundir + '/lib/modules/' + module + '.js');
                           app.event.emit('module_' + module + '_load');
                       }
                       app.event.emit('ircSay', to, 'Added ' + module + ' to the auto load list');
                       break;
                   case 'list':
                       var string = 'The modules loaded are:';
                       for(var a in app.modules){
                           string = string + ' ' + a;
                       }
                       app.event.emit('ircSay', to, string);
                       break;
                   default:
                       app.event.emit('ircSay', to, 'Usage: !module <load|unload|reload|autoload|list> <module>');
                       break;
               }
               break;
       }
    });
});

app.modules['core'] = require(app.rundir + '/lib/modules/core.js');
app.event.emit('module_core_load');

for(var a in config['autoload']){
    console.log('Autoloading ' + a);
    app.modules[a] = require(app.rundir + '/lib/modules/' + a + '.js');
    app.event.emit('module_' + a + '_load');
}