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
    file: __dirname + "/passwds.txt"
});

var app = express();

app.set('view engine', 'jade');

app.use(auth.connect(basic));
app.use(busboy());
app.use(cookieParser('secret'));
app.use(session({
            secret: "cookie_secret",
            resave: false,
            saveUninitialized: false}));
            app.use(flash());

app.post('/', function(req, res) {
    var fstream;
    var dirname = __dirname + '/uploads/unprocessed/' + Date.now();

    req.pipe(req.busboy);

    console.log("------------------ New recording ------------------");

    fs.mkdirs(dirname, function(err) {
            if (err) return console.log(' ----- ERROR IN DIRECTORY CREATION: ', err);
            console.log("  -- Made directory: ", dirname);
        });

    req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
        if (key === "filename") {
            var recording_path = dirname + '/' + value + '.ogg';
            fs.ensureFile(recording_path, function(err) {
                if (err) return console.log(' ----- ERROR IN FILE CREATION: ', err);
                console.log("  -- Created empty file: ", recording_path);
            });
        }
        else if (key === "message") {
            fs.outputFile(dirname + '/message.txt', value, function(err) {
                if (err) return console.log(' ----- ERROR WRITING MESSAGE TO FILE: ', err);
                console.log("  -- Wrote message.");
            });
        }
    });

    req.busboy.on('file', function (fieldname, file, filename) {
        fstream = fs.createWriteStream(dirname + '/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log(" -- Finished upload.");
            req.flash('info', 'Got it!');
            res.redirect('/');
        });
    });
});

app.get('/', function (req, res) {
    res.render('index', {message: req.flash('info')});
});

app.get('/you_asked_for_it', function(req, res) {
    res.render('rick')
});

// get pi an ssh key
// pi sends correct username and password in http request
// this method will return a list of the subdirs that have been processed
// pi will scp them to itself
// app.param('timestamp', /\w+/);
app.param(function(name, fn){
    if (fn instanceof RegExp) {
        return function(req, res, next, val){
            var captures;
            if (captures = fn.exec(String(val))) {
                req.params[name] = captures;
                next();
            } else {
                next('route');
            }
        }
    }
});
app.param('timestamp', /^\d+$/);
app.get(/\/processed\/(\w+)/, function(req, res) {
    console.log(req.params[0]);
// app.get('/processed/:timestamp', function(req, res) {
    // console.log(req.params.timestamp);
})

// when pi has successfully scp'd subdir, it will send request with param of timestamp saved
// we can then transfer the subdir to a 'transferred' subdir
// app.get('/transferred', function(req, res)) {
//
// })


var server = app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)
})
