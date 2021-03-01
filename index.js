const https = require('https')
const fs = require('fs')
const express = require('express');
const app = express();
const config = require('./config.json');
const sql = require('./utils/sql.js')
sql.initDB()
const key = fs.readFileSync(__dirname + '/cert/private.key', 'utf8');
const cert = fs.readFileSync(__dirname + '/cert/certificate.crt', 'utf8');
const options = {
    key: key,
    cert: cert,
};

const webServer = https.createServer(options, app);

const socketServer = https.createServer(options, app);
const io = require("socket.io")(socketServer, {
  cors: {
    origin: "*",
  },
});

webServer.listen(config.webPort, () => {
    console.log(`wsh bb go ${config.webPort}`)
});
socketServer.listen(config.socketPort, () => {
    console.log(`socket on ${config.socketPort}`)
});

io.on('connection', client => {
    console.log("new Client")

    client.on("refreshList", (data) => {
        data = JSON.parse(data)
        sql.getList(data, function (list) {
            client.emit("refreshList", JSON.stringify(list))
        })
    })

    client.on("requestNewAlcool", (data) => {
        data = JSON.parse(data)
        sql.addAlcool(data, function () {
            sql.getList({}, function (list) {
                client.emit("refreshList", JSON.stringify(list))
            })
        })
    })

    client.on("wannaRegister", (data) => {
        data = JSON.parse(data)
        sql.registerUser(data, function () {
            if (data=='USER ALREADY EXIST') {
                client.emit("notify", "Cette email/nom d'utilisateur est déjà utilisé")
            } else {
                client.emit("registerValidated", JSON.stringify(data))
            }
        })
    })

    client.on("tryConnect", (data) => {
        data = JSON.parse(data)
        sql.tryConnect(data, function (result) {
            console.log("callback : ")
            console.log(result)
            if (result=='WRONG PASS') {
                client.emit("notify", "Le mot de passe ne correspond pas")
            } else if (result=='NO USER FINDED') {
                client.emit("notify", "Aucun utilisateur trouvé avec ces informations")
            } else {
                client.emit("connectValidated", JSON.stringify(result))
            }
        })
    })

    client.on("refreshRequestAlcool", (token) => {
        sql.getRequestList(token, function (list) {
            client.emit("refreshRequestAlcool", JSON.stringify(list))
        })
    })

    client.on("acceptRequest", (data) => {
        data = JSON.parse(data)
        sql.acceptRequest(data, function () {
            sql.getList(data, function (list) {
                client.emit("refreshList", JSON.stringify(list))
            })
            sql.getRequestList(data.token, function (list) {
                client.emit("refreshRequestAlcool", JSON.stringify(list))
            })
        })
    })

    client.on("refuseRequest", (data) => {
        data = JSON.parse(data)
        sql.refuseRequest(data, function () {
            sql.getRequestList(data.token, function (list) {
                client.emit("refreshRequestAlcool", JSON.stringify(list))
            })
        })
    })  
    
    client.on('disconnect', () => { /* … */ });
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/', function (req, res) {
    fs.readFile(__dirname +"/client/index.html", function (err,data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
});

app.get('/:file', function (req, res) {
    fs.readFile(__dirname +"/client/"+req.params.file, function (err,data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
})