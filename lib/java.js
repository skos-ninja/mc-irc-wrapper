var irc = require('./irc.js');
var spawn = require('child_process').spawn;
var javas = {};
var fs = require('fs');

exports.javaSpawn = function(obj, callback){
    fs.exists('./pid/' + obj['name'], function(exists) {
       if(exists == true){
           console.log('Java Process exists');
           callback(true);
       }
       else{
           console.log('No Java Process, Spawning server');
           javas[obj['name']] = spawn('java', ['-Xms' + obj['minram'], '-Xmx' + obj['maxram'], '-jar', obj['jar'], 'nogui'], {detached:true, cwd: './servers/' + obj['name'] + '/' + obj['directory']});
           fs.writeFileSync('./pid/' + obj['name'], javas[obj['name']].pid);
           javas[obj['name']].on('close', function(code) {
               try{
                   fs.unlinkSync('./pid/' + obj['name']);
               }
               catch (e){}
           });
           callback(false);
       }
    });
};

exports.javaKill = function(obj, callback){
    fs.exists('./pid/' + obj['name'], function(exists) {
       if(exists == true){
           console.log('Killing Server');
           try{
               process.kill(javas[obj['name']].pid, 'SIGINT');
           }
           catch (e){
               console.log(e);
               callback(true);
           }
           try{
               fs.unlinkSync('./pid/' + obj['name']);
           }
           catch (e){}
           delete javas[obj['name']];
       }
        else {
           console.log('No Process to kill!');
           callback(true);
       }
    });
};

exports.javaRespawn = function(obj, callback){
    exports.javaKill(obj, function(err) {
    });
    exports.javaSpawn(obj, function(err){
        if(err){
            callback(false);
        }
    });
    callback(true)
};

exports.javaTail = function(obj, callback){

};
