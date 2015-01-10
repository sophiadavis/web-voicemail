// Authentication module -- https://github.com/gevorg/http-auth
var auth = require('http-auth');
var express = require('express');
var fs = require('fs-extra');
var http = require('http');
var path = require('path');
var busboy = require('connect-busboy');

var basic = auth.basic({
    realm: "Simon Area.", // wtf
    file: __dirname + "/passwds.txt"  // gevorg:gpass, Sarah:testpass ...
});

var app = express();
app.use(busboy());
app.use(auth.connect(basic));

app.post('/', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {

        //Path where image will be uploaded
        fstream = fs.createWriteStream(__dirname + '/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log("Finished uploading " + filename);
            res.redirect('back');
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
