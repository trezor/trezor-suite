'use strict';

exports.__esModule = true;
exports.BlockchainMessage = exports.ResponseMessage = exports.TransportMessage = exports.DeviceMessage = exports.UiMessage = void 0;

var _constants = require("../constants");

var UiMessage = function UiMessage(type, payload) {
  return {
    event: _constants.UI_EVENT,
    type: type,
    payload: payload
  };
};

exports.UiMessage = UiMessage;

var DeviceMessage = function DeviceMessage(type, payload) {
  return {
    event: _constants.DEVICE_EVENT,
    type: type,
    payload: payload
  };
};

exports.DeviceMessage = DeviceMessage;

var TransportMessage = function TransportMessage(type, payload) {
  return {
    event: _constants.TRANSPORT_EVENT,
    type: type,
    payload: payload
  };
};

exports.TransportMessage = TransportMessage;

var ResponseMessage = function ResponseMessage(id, success, payload) {
  if (payload === void 0) {
    payload = null;
  }

  return {
    event: _constants.RESPONSE_EVENT,
    type: _constants.RESPONSE_EVENT,
    id: id,
    success: success,
    payload: payload
  };
};

exports.ResponseMessage = ResponseMessage;

var BlockchainMessage = function BlockchainMessage(type, payload) {
  return {
    event: _constants.BLOCKCHAIN_EVENT,
    type: type,
    payload: payload
  };
};

exports.BlockchainMessage = BlockchainMessage;