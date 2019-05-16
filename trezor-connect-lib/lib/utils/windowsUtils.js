"use strict";

exports.__esModule = true;
exports.sendMessage = sendMessage;
exports.sendMessageToOpener = void 0;

// send message from iframe to parent
function sendMessage(message, origin) {
  return window.parent.postMessage(message, origin);
} // send message from popup to parent


var sendMessageToOpener = function sendMessageToOpener(message, origin) {
  if (window.opener) {
    return window.opener.postMessage(message, origin);
  } else {
    // webextensions are expecting this message in "content-script" which is running in "this.window", above this script
    window.postMessage(message, window.location.origin);
  }
};

exports.sendMessageToOpener = sendMessageToOpener;