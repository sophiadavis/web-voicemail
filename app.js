// Authentication module -- https://github.com/gevorg/http-auth
var auth = require('http-auth');
var busboy = require('connect-busboy');
var cookieParser = require('cookie-parser');
var express = require('express');
var flash = require('connect-flash');
var fs = require('fs-extra');
var glob = require('glob');
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
            secret: 'cookie_secret',
            resave: false,
            saveUninitialized: false}));
            app.use(flash());

app.post('/', function(req, res) {
    console.log('\n------------------ POST / ------------------');
    console.log('------------------ New recording from ', req.user, ' ------------------');

    var fstream;
    var dirname = __dirname + '/uploads/unprocessed/' + Date.now();

    req.pipe(req.busboy);

    fs.mkdirs(dirname, function(err) {
            if (err) return console.log(' ----- ERROR IN DIRECTORY CREATION: ', err);
            console.log('  -- Made directory: ', dirname);
    });

    fs.ensureFile(dirname + '/' + req.user, function(err) {
        if (err) return console.log(' ----- ERROR IN USERNAME: ', err);
        console.log('  -- Recorded username.');
    });

    req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
        if (key === 'filename') {
            var recording_path = dirname + '/' + value + '.ogg';
            fs.ensureFile(recording_path, function(err) {
                if (err) return console.log(' ----- ERROR IN FILE CREATION: ', err);
                console.log('  -- Created empty file: ', recording_path);
            });
        }
        else if (key === 'message') {
            fs.outputFile(dirname + '/message.txt', value, function(err) {
                if (err) return console.log(' ----- ERROR WRITING MESSAGE TO FILE: ', err);
                console.log('  -- Wrote message.');
            });
        }
    });

    req.busboy.on('file', function (fieldname, file, filename) {
        fstream = fs.createWriteStream(dirname + '/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log('  -- Finished upload.');
            req.flash('info', 'Got it!');
            res.redirect('/');
        });
    });
});

app.get('/', function (req, res) {
    console.log('\n------------------ GET / ------------------');
    res.render('index', {message: req.flash('info')});
});

app.get('/you_asked_for_it', function(req, res) {
    console.log('\n------------------ GET RICK ------------------');
    res.render('rick')
});

// get pi an ssh key
// pi sends correct username and password in http request
// this method will return a list of the subdirs that have been processed
// pi will scp them to itself
app.get('/processed', function(req, res) {
    console.log('\n------------------ GET /processed ------------------');

    glob('uploads/processed/*', function (err, files) {
        if (err) return console.log(' ----- ERROR GLOBBING: ', err);

        var files_with_abs_path = files.map(function(name) {return __dirname + '/' + name;});
        console.log('  -- Sending paths to processed recordings.');

        res.json(JSON.stringify(files_with_abs_path));
    });
});

app.get(/\/transferred\/(\w+)/, function(req, res) {
    console.log('\n------------------ GET /transferred ------------------');

    var recording_id = req.params[0]
    console.log('  -- Received confirmation about recording: ', recording_id);

    var processed_dir = __dirname + '/uploads/processed/' + recording_id
    var transferred_dir = __dirname + '/uploads/transferred/' + recording_id

    fs.copy(processed_dir, transferred_dir, function(err) {
        if (err) console.log(' ----- ERROR COPYING DIRECTORY ' + recording_id + ' :' + err);
        console.log('  -- Moved directory with recording ' + recording_id + 'from /processed/ to /transferred/.');

        fs.remove(processed_dir, function(err) {
            if (err) console.log(' ----- ERROR DELETING DIRECTORY ' + recording_id + ' :' + err);
            console.log('  -- Deleted directory with recording ' + recording_id + 'from /processed/.');
        });
    });
    res.send('Roger.');
});


var server = app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)
})
