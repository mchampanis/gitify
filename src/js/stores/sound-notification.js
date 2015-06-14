var ipc = window.require('ipc');
var Reflux = require('reflux');
var _ = require('underscore');

var Actions = require('../actions/actions');
var SettingsStore = require('../stores/settings');

var SoundNotificationStore = Reflux.createStore({
  listenables: Actions,

  init: function () {
    this._previousNotifications = [];
    this._audio = new Audio('sounds/digi.wav');
  },

  playSound: function () {
    this._audio.play();
  },

  showNotification: function (countNew, response, latestNotification) {
    var title = (countNew == 1 ?
      'Gitify - ' + latestNotification.full_name :
      'Gitify');
    var body = (countNew == 1 ?
      latestNotification.subject :
      'You\'ve got ' + countNew + ' notifications.');
    var nativeNotification = new Notification(title, {
      body: body
    });
    nativeNotification.onclick = function () {
      ipc.sendChannel('reopen-window');
    };
  },

  onIsNewNotification: function (response) {
    var self = this;
    var playSound = SettingsStore.getSettings().playSound;
    var showNotifications = SettingsStore.getSettings().showNotifications;

    if (!playSound && !showNotifications) { return; }

    // Check if notification is already in the store.
    var newNotifications = _.filter(response, function (obj) {
      return !_.contains(self._previousNotifications, obj.id);
    });

    // Play Sound / Show Notification.
    if (newNotifications && newNotifications.length) {
      if (playSound) {
        self.playSound();
      }
      if (showNotifications) {
        this.showNotification(newNotifications.length, response, {
          full_name: newNotifications[0].repository.full_name,
          subject: newNotifications[0].subject.title
        });
      }
    }

    // Now Reset the previousNotifications array.
    self._previousNotifications = _.map(response, function (obj) {
      return obj.id;
    });
  }

});

module.exports = SoundNotificationStore;
