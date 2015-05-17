var app = require('../../app.js');
var fs = require('fs');
if(fs.existsSync(app.rundir + '/configs/highfive.json')){
    var db = require(app.rundir + '/configs/highfive.json');
}
else{
    var db = null;
}
var cmdname = 'o/';
var cmdname_alt = "\\o";
var eventname = 'module_highfive_cmd';
var buffer = null;
var timer = null;

function highfive(user, channel){
    var amount = 1;
    if(buffer != user) {
        if (buffer == null) {
            buffer = user;
            timer = setTimeout(function(){ buffer = null; }, 6000000);
        }
        else {
            if (!db) {
                db = {};
            }
            if (db[user + '_' + buffer]) {
                amount = amount + db[user + '_' + buffer];
                delete db[user + '_' + buffer];
            }
            if (db[buffer + '_' + user]) {
                amount = amount + db[buffer + '_' + user];
            }
            if (amount == 1) {
                var time = 'time';
            }
            else {
                var time = 'times';
            }
            db[buffer + '_' + user] = amount;
            app.event.emit('ircSay', channel, buffer + ' has o/*\\o with ' + user + ' ' + amount + ' ' + time);
            buffer = null;
            clearTimeout(timer);
        }
    }
}

app.event.on(eventname, function(message, from, to){
    if(app.config.debug){
        console.log('Debug: ' + message);
        console.log('Debug: ' + from);
        console.log('Debug: ' + to);
        console.log('Debug: ' + buffer);
    }
    switch (message)
    {
        case cmdname:
            highfive(from, to);
            break;

        case cmdname_alt:
            highfive(from, to);
            break;

        default:
            return;
    }
});

app.event.on('module_highfive_remove', function(){
    app.commands.unregister(cmdname);
    app.commands.unregister(cmdname_alt);
    app.config.saveConfig('highfive.json', db, function (err) {
        if(err){
            throw err;
        }
    });
    delete app.modules['highfive'];
    delete require.cache[app.rundir + '/lib/modules/highfive.js'];
    delete require.cache[app.rundir + '/configs/highfive.json'];
});

app.commands.register(cmdname, eventname, false, '');
app.commands.register(cmdname_alt, eventname, false, '');

app.event.on('appStopping', function(){
    app.config.saveConfig('highfive.json', db, function(err){
        if(err){
            throw err;
        }
    });
});

app.event.emit('module_highfive_ready');