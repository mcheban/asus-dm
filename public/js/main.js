var sumjq = function(selector) {
    var sum = 0;
    $(selector).each(function() {
      sum += parseFloat($(this).text());
    });
    return sum;
};

var updateList = function() {
  $.ajax({
    url: '/tasks/html',
    success: function(data) {
      $('#tasks').html(data);
      $('#count').html($('#tasks .task').length);
      $('#totalDown').html(sumjq($('#tasks .task .down')).toFixed(2).replace(/\.0{0,2}$/, ''));
      $('#totalUp').html(sumjq($('#tasks .task .up')).toFixed(2).replace(/\.0{0,2}$/, ''));
    }
  });
};
var taskAction = function(taskId, action, type, callback) {
  $.ajax({
    method: 'POST',
    url: '/tasks/action',
    data: {
      action: action,
      task: taskId,
      type: type
    },
    success: function(data) {
      console.log('Done:' + data);
      if(callback) {
        callback(data);
      }
    }
  });
};
var addUrl = function(url, callback) {
  $.ajax({
    method: 'POST',
    url: '/tasks/url',
    data: {
      url: url
    },
    success: function(data) {
      console.log('Done:' + data);
      if(callback) {
        callback(data);
      }
    }
  });
};
var addFile = function(file, callback) {
  var formData = new FormData();
  formData.append('filename', file, file.name);
  $.ajax({
    url: '/tasks/file',
    method: 'POST',
    processData: false,
    contentType: false,
    data: formData,
    success: function(data) {
      console.log('Done:' + data);
      if(callback) {
        callback(data);
      }
    }
  });
};

var processResponse = function(data) {
  if(data.search(/BT_ACK_SUCESS/) >= 0) {
    console.log('Success');
    var fileResult = data.split('BT_ACK_SUCESS=');
    var dataStr = fileResult[1].split(', #');
    fname = dataStr[0];
    btFileName = dataStr[1];
    
    $.ajax({
      url: '/tasks/file/bt',
      method: 'POST',
      data: {
        filename: btFileName,
        downloadType: 'All'
      },
      success: function(data) {
        console.log('Done:' + data);
        processResponse(data);
        updateList();
      }
    });
    
  } else if(data.search(/ACK_SUCESS/) >= 0) {
    console.log('Success');
  } else if(data.search(/ACK_FAIL/) >= 0) {
    alert('Failed to add the new download task.');
  } else if(data.search(/BT_EXIST/) >= 0) {
    alert('The task already exists.');
  } else if(data.search(/LIGHT_FULL/) >= 0) {
    alert('The http/ftp task list is full.');
  } else if(data.search(/HEAVY_FULL/) >= 0) {
    alert('The BT task list is full.');
  } else if(data.search(/NNTP_FULL/) >= 0) {
    alert('The NZB task list is full.');
  } else if(data.search(/TOTAL_FULL/) >= 0) {
    alert('The task list is full.');
  } else if(data.search(/DISK_FULL/) >= 0) {
    alert('There is not enough space to store the file.');
  }
};
$(function() {
  $('#tasks').on('click', 'button.action', function() {
    var $this = $(this);
    var taskId = $this.attr('data-task');
    var action = $this.attr('data-action');
    var type = $this.attr('data-type');
    taskAction(taskId, action, type, function actionCallback() {
      updateList();
    });
  });
  $('#header .buttons button.action').on('click', function() {
    var $this = $(this);
    var action = $this.attr('data-action');
    taskAction(null, action, 'ALL', function actionCallback(data) {
      processResponse(data);
      updateList();
    });
  });
  $('#showAdd').on('click', function() {
    $('#addBox').toggle();
    if($('#addUrl').is(':visible')) {
      $('#addUrl').focus();
    }
  });
  $('#add').on('click', function() {
    var $file = $('#addFile');
    var file = $file.val();
    var url = $('#addUrl').val();
    if(!file && !url) {
      alert('No file or url provided!');
      return false;
    }
    url = url.replace(/\n/g,'');
    if(url) {
      addUrl(url, function addUrlCallback(data) {
        processResponse(data);
        $('#addUrl').val('');
        $('#addBox').hide();
        updateList();
      });
    } else if(file) {
      addFile($file[0].files[0], function addFileCallback(data) {
        processResponse(data);
        $('#addFile').val('');
        $('#addBox').hide();
        updateList();
      });
    }
    return false;
  });
  updateList();
  setInterval(updateList, 2000);
});

