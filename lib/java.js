var irc = require('./irc.js');
var files = require('./files.js');
var spawn = require('child_process').spawn;
var javas = {};
var fs = require('fs');

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
           fs.writeFileSync('./pid/' + obj['name'], javas[obj['name']].pid);
           javas[obj['name']].stdout.on('data', function (data) {
               if (files.debug) {
                   if (data != 0) {
                       console.log('stdout: ' + data);
                   }
               }
           });
           javas[obj['name']].stderr.on('data', function (data) {
               if (files.debug) {
                   console.log('stderr: ' + data);
               }
           });
           javas[obj['name']].on('close', function (code) {
               try {
                   fs.unlinkSync('./pid/' + obj['name']);
               }
               catch (e) {
               }
           });
       }
           callback(false);
    });
};

exports.javaKill = function(obj, callback){
    fs.exists('./pid/' + obj['name'], function(exists) {
       if(exists == true){
           console.log('Killing Server');
           if(javas[obj['name']]){
               try{
                   javas[obj['name']].kill();
               }
               catch (e){
                   console.log(e);
               }
               delete javas[obj['name']];
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
            exports.javaKill(obj, function(err){

            });
            exports.javaSpawn(obj, function(err){

            });
        }
        else {
            exports.javaSpawn(obj, function(err){

            });
        }
    });
    callback(true)
};

exports.javaTail = function(obj, callback){

};
