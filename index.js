var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var basicAuth = require('basic-auth');
var term = require('term.js');
var ssh = require('ssh2');
var readConfig = require('read-config'),
    config = readConfig(__dirname + '/config.json');

config.listen = {
    port : process.env.PORT || 3000
};

server.listen(config.listen.port).on('error', function (err) {
    if (err.code === 'EADDRINUSE') {
        config.listen.port++;
        console.log('Address in use, retrying on port ' + config.listen.port);
        setTimeout(function () {
            server.listen(config.listen.port);
        }, 250);
    }
});

app.use(express.static(__dirname + '/public')).use(term.middleware()).get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

io.on('connection', function(socket) {
    var option = {
        ssh : {
            host : '127.0.0.1',
            port : 22
        },
        user : {
            name : 'root',
            password : 'sksks'
        }
    };
    var conn;
    socket.on('doit', function () {
        conn = new ssh();
        var info = {
            host: option.ssh.host,
            port: option.ssh.port,
            username: option.user.name,
            tryKeyboard: true,
            algorithms: {
                'cipher': ['aes128-cbc', '3des-cbc', 'aes256-cbc'],
                'hmac': ['hmac-sha1', 'hmac-sha1-96', 'hmac-md5-96']
            }
        };
        if (option.privateKey)
            info.privateKey = option.privateKey
        else
            info.password = option.user.password
        conn.on('banner', function(msg, lng) {
            socket.emit('data', msg);
        }).on('ready', function() {
            socket.emit('title', 'ssh://' + option.ssh.host);
            socket.emit('headerBackground', config.header.background);
            socket.emit('header', config.header.text);
            socket.emit('footer', 'ssh://' + option.user.name + '@' + option.ssh.host + ':' + option.ssh.port);
            socket.emit('status', 'SSH CONNECTION ESTABLISHED');
            socket.emit('statusBackground', 'green');
            conn.shell(function(err, stream) {
                stream.setWindow(32, 128);
                if (err) return socket.emit('status', 'SSH EXEC ERROR: ' + err.message).emit('statusBackground', 'red');
                socket.on('data', function(data) {
                        stream.write(new Buffer(data));
                });
                stream.on('data', function(d) {
                    socket.emit('data', d.toString('utf-8'));
                }).on('close', function() {
                    conn.end();
                });
            });
        }).on('end', function() {
            socket.emit('status', 'SSH CONNECTION CLOSED BY HOST');
            socket.emit('statusBackground', 'red');
        }).on('close', function() {
            socket.emit('status', 'SSH CONNECTION CLOSED');
            socket.emit('statusBackground', 'red');
        }).on('error', function(error) {
            socket.emit('status', 'SSH CONNECTION ERROR - ' + error);
            socket.emit('statusBackground', 'red');
        }).on('keyboard-interactive', function(name, instructions, instructionsLang, prompts, finish) {
            console.log('Connection :: keyboard-interactive');
            finish([option.user.password]);
        }).connect(info);
    }).on('auth', function (data) {
        option.ssh.host = data.host || '127.0.0.1';
        option.ssh.port = parseInt(data.port || 22);
        option.user.name = data.user || 'root';
        option.user.password = data.pass || 'sksks';
        if (data.privateKey)
            option.privateKey = data.privateKey;
        socket.emit('auth', {});
    }).on('error', function () {
        try {
            conn.end();
        } catch (e) {
            console.log(e.toString());
        }
    }).on('disconnect', function () {
        try {
            conn.end();
        } catch (e) {
            console.log(e.toString());
        }
    });
});
