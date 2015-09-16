var express = require('express');
var Promise = require('bluebird');
var router = express.Router();
var GCMDevice = require('../models/GCMDevice.js');
var APNSDevice = require('../models/APNSDevice.js');

var cleanseNotification = function cleanseNotification(notification) {
  if (!notification.hasOwnProperty('message')) {
    return Error('No message in notification body.');
  } else if (!notification.hasOwnProperty('title')) {
    return Error('No title in notification body.');
  } else {
    return notification;
  }
}

router.post('/', function(req, res) {
  var body = req.body;
  try{
    var notification = cleanseNotification(body.notification);
  }
  catch (err) {
    return res.status(400).json(err);
  }

  var gcmRegIDs = GCMDevice.andWhere({active: true});
  var apnRegIDs = APNSDevice.andWhere({active: true});

  if (body.bulkFlag !== true) {
    if (!body.hasOwnProperty('subscriberID')) {
      return res.status(400).json('No subscriberID found in request.');
    } else if (body.subscriberID.length === 0) {
      return res.status(400).json('subscriberID list is empty.');
    } else {
      var subscriberID = body.subscriberID;
      gcmRegIDs = gcmRegIDs.whereIn('subscriber_id', subscriberID);
      apnRegIDs = apnRegIDs.whereIn('subscriber_id', subscriberID);
    }
  }

  Promise.all([
    gcmRegIDs,
    apnRegIDs
  ]).spread(function(gcmDevices, apnDevices){
    var gcmRegIDs = gcmDevices.map(function(device) {
      return registration_id;
    });
    var apnRegIDs = gcmDevices.map(function(device) {
      return registration_id;
    });
    if (gcmRegIDs.length > 0 && apnRegIDs.length > 0) {
      return Promise.all([
        transformAndSendGCMNotifications(notification, gcmRegIDs),
        transformAndSendAPNSNotifications(notification, apnRegIDs)
      ]).spread(function(gcmResult, apnResult) {
        return {
          success: gcmResult.success + apnResult.success,
          failure: gcmResult.failure + apnResult.failure,
          unknown: gcmResult.unknown + apnResult.unknown
        };
      });
    } else if (gcmRegIDs.length > 0) {
      return transformAndSendGCMNotifications(notification, gcmRegIDs);
    } else if (apnRegIDs.length > 0) {
      return transformAndSendAPNSNotifications(notification, apnRegIDs);
    } else {
      return {success: 0, failure: 0, unknown: 0};
    }
  }).then(function(result) {
    res.status(200).json(result);
  }).catch(function(err) {
    res.status(500).json(err);
  });
});

module.exports = router;
