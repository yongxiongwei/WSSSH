# WSSSH
SpringHack WSSSH Client: using ssh2, socket.io, term.js, and express connect to ssh server.

Base on billchurch's WebSSH2: [billchurch/WebSSH2](https://github.com/billchurch/WebSSH2)

Bare bones example of using SSH2 as a client on a host to proxy a Websocket / Socket.io connection to a SSH2 server. 

![](http://ww1.sinaimg.cn/large/7eb49035jw1f7074e83gsj211y0jl780.jpg)

# Instructions
To install, copy to a location somewhere and 'npm install'

Edit index.js to change the listener to something (maybe I'll make this CLI arguments at some point?)

Fire up a browser, navigate to IP/port of your choice:

http://localhost:3000/

You will be prompted for credentials to use on the SSH server via WebSocket.

