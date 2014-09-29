var express = require('express');
var request = require('request');
var router = express.Router();
var fs = require('fs');
var dmBaseUrl = 'http://192.168.0.1:8081/downloadmaster';
var authRequest = request.defaults({ 
      auth: {
        user: process.env.DM_USER,
        pass: process.env.DM_PASS,
        sendImmediately: true
      }
    });

function Task(record) {
  this.id = record[0].trim();
  this.fileName = record[1].trim();
  this.size = record[3].trim();
  this.status = record[4].trim().toLowerCase();
  this.type = record[5].trim();
  this.time = record[6].trim();
  this.download = record[7].trim().replace(' KBps', '');
  this.upload = record[8].trim().replace(' KBps', '');
  this.peers = record[9].trim();
  this.downloadDir = record[12].trim();
  this.doneSize = '0';
  this.progress = this.type === 'BT'
              ? record[11].trim()
              : record[2].trim();
  this.percent = (this.progress * 100).toFixed(2).replace(/\.0{0,2}$/, '');
  if(this.size.trim()) {
    this.doneSize = (parseFloat(this.size) * this.progress).toFixed(2).replace(/\.0{0,2}$/, '')
                    + this.size.substr(this.size.length - 3, 3);
  }
}

function loadTasks(mode, callback) {
  var url = dmBaseUrl + '/dm_print_status.cgi?action_mode=' + mode + '&t=' + Math.random();
  authRequest.get(url, function(err, res, body) {
    var tasks = new Array();
    var records = new Array();
    eval("records=[" + body + "]");
    for(idx in records) {
      tasks.push(new Task(records[idx]));
    }
    callback(tasks);
  });
}

router.get('/json', function(req, res) {
  loadTasks(req.params.mode || 'All', function(tasks) {
    res.json(tasks);
  });
});

router.get('/html', function(req, res) {
  loadTasks(req.params.mode || 'All', function(tasks) {
    res.render('tasks', { tasks: tasks });
  });
});

router.post('/file', function(req, res) {
  var url = dmBaseUrl + '/dm_uploadbt.cgi';
  var reqp = req.pipe(authRequest(url).on('response', function(response) {
    console.log('Response received');
    response.on('data', function(data) {
      console.log('received ' + data.length + ' bytes of compressed data');
    });
    if(!req.xhr) {
      res.redirect('/');
    }
  }).on('data', function(data) {
    // decompressed data as it is received
    console.log('Data: ' + data)
  }));
  if(req.xhr) {
    reqp.pipe(res);
  }
});

router.post('/url', function(req, res) {
  var url = dmBaseUrl + '/dm_apply.cgi';
  var qs = {
    action_mode: 'DM_ADD',
    download_type: 5,
    again: 'no',
    usb_dm_url: req.param('url'),
    t: Math.random()
  };
  console.log(qs);
  authRequest.get({url: url, qs: qs}, function(error, response, body) {
    if(error) {
      log.error('Error', error);
      return;
    }
    console.log('Response: ' + body)
    res.send(body);
  });
});

router.post('/file/bt', function(req, res) {
  var url = dmBaseUrl + '/dm_uploadbt.cgi';
  var qs = {
    filename: req.param('filename'),
    download_type: req.param('downloadType'),
    D_type: 3,
    t: Math.random()
  };
  console.log(qs);
  authRequest.get({url: url, qs: qs}, function(error, response, body) {
    if(error) {
      log.error('Error', error);
      return;
    }
    console.log('Response: ' + body)
    res.send(body);
  });
});

router.post('/action', function(req, res) {
  var url = dmBaseUrl + '/dm_apply.cgi';
  var qs = {
    action_mode: 'DM_CTRL',
    dm_ctrl: req.param('action'),
    task_id: req.param('task'),
    download_type: req.param('type'),
    t: Math.random()
  };
  console.log(qs);
  authRequest.get({url: url, qs: qs}, function(error, response, body) {
    if(error) {
      log.error('Error', error);
      return;
    }
    console.log('Response: ' + body)
    res.send(body);
  });
});

module.exports = router;
