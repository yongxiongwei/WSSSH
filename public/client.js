var client = {
    info : {},
    is : false
};


client.handleFiles = function (files) {
    if (files.length)
    {
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function () {
            client.info.privateKey = this.result;
        };
        reader.readAsText(file);
        document.getElementById('cfile').innerHTML = 'Key file -> ' +  file.name;
    }
}

client.connect = function () {
    if (client.is)
        return;
    client.is = true;
    client.info.user = document.getElementById('user').value;
    client.info.pass = document.getElementById('pass').value;
    client.info.port = document.getElementById('port').value;
    client.info.host = document.getElementById('host').value;
    client.ws.emit('auth', client.info);
    document.getElementById('term-can').style.display = 'block';
    document.getElementById('login').style.display = 'none';
};

client.run = function(options) {
    options = options || {};
    document.getElementById('login').onkeydown = function (event) {
        if (event.keyCode == 32 || event.keyCode == 13 || event.keyCode == 10)
            if (event.target == document.getElementById('cfile'))
                document.getElementById('cfile').click();
            else
                client.connect();
    };
    window.addEventListener('load', function() {
        var socket = io.connect();
        client.ws = socket;
        socket.on('connect', function() {
            var term = new Terminal({
                cols: 128,
                rows: 32 
            });
            term.on('data', function(data) {
                socket.emit('data', data);
            });
            socket.on('title', function(data) {
                document.title = data;
            }).on('status', function(data) {
                document.getElementById('status').innerHTML = data;
            }).on('headerBackground', function(data) {
                document.getElementById('header').style.backgroundColor = data;
            }).on('header', function(data) {
                document.getElementById('header').innerHTML = data;
            }).on('footer', function(data) {
                document.getElementById('footer').innerHTML = data;
            }).on('statusBackground', function(data) {
                document.getElementById('status').style.backgroundColor = data;
            }).on('auth', function (data) {
                socket.emit('doit', {});
            });
            term.open(document.getElementById("terminal"));
            socket.on('data', function(data) {
                term.write(data);
            }).on('disconnect', function() {
                document.getElementById('status').style.backgroundColor = 'red';
                document.getElementById('status').innerHTML = 'WEBSOCKET SERVER DISCONNECTED';
                socket.io.reconnection(false);
            }).on('error', function(err) {
                document.getElementById('status').style.backgroundColor = 'red';
                document.getElementById('status').innerHTML = 'ERROR ' + err;
            });
        });
    }, false);
}
