// Authentication module -- https://github.com/gevorg/http-auth
var auth = require('http-auth');
var busboy = require('connect-busboy');
var cookieParser = require('cookie-parser');
var express = require('express');
var flash = require('connect-flash');
var fs = require('fs-extra');
var http = require('http');
var path = require('path');
var session = require('express-session');

var basic = auth.basic({
    realm: "Simon Area.", // wtf
    file: __dirname + "/passwds.txt"  // gevorg:gpass, Sarah:testpass ...
});

var app = express();
app.use(auth.connect(basic));
app.use(busboy());
app.use(cookieParser('secret'));
app.use(require('express-jquery')('/jquery.js'));
app.use(session({
            secret: "cookie_secret",
            // cookie: { maxAge: 60000 },
            resave: false,
            saveUninitialized: false}));
            app.use(flash());

app.post('/', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {

        //Path where image will be uploaded
        fstream = fs.createWriteStream(__dirname + '/uploads/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log("Finished uploading " + filename);
            req.flash('info', 'it worked');
            console.log(req.flash('info'));
            // var str = $("div#the-flash-box").text();
            console.log(str);
            res.redirect('back');
            // res.render('index', { messages: req.flash('info') });
        });
    });
});

app.get('/', function(req, res) {
    var index = path.join(__dirname, 'public', 'index.html');
    res.sendFile(index);
});


var server = app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)
})
