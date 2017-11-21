'use strict';

var _socket2 = require('socket.io-client');

var _socket3 = _interopRequireDefault(_socket2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// socket.io is enclosed inside worker,
// because it behaves unpredictably + is slow
// (I don't like socket.io.)


var socket = null;
var events = {};

// eslint-disable-next-line no-undef
onmessage = function onmessage(event) {
    var data = JSON.parse(event.data);

    if (data.type === 'init') {
        var _endpoint = data.endpoint,
            _connectionType = data.connectionType;

        socket = (0, _socket3.default)(_endpoint, {
            transports: [_connectionType],
            reconnection: false
        });
        socket.on('connect', function () {
            return doPostMessage({
                type: 'initDone'
            });
        });
        socket.on('connect_error', function (e) {
            doPostMessage({
                type: 'initError'
            });
            close();
        });
    }

    if (data.type === 'close') {
        // a hack to prevent Firefox errors in karma tests
        // it doesn't break anything - since on closing the worker, no timeouts will ever happen anyway
        try {
            // eslint-disable-next-line no-global-assign,no-native-reassign
            setTimeout = function fun() {};
        } catch (e) {
            // intentionally empty - thread is closing anyway
        }

        if (socket != null) {
            socket.disconnect(true);
        }
        socket = null;
        close();
    }

    if (data.type === 'observe') {
        var eventFunction = function eventFunction(reply) {
            doPostMessage({
                type: 'emit',
                event: data.event,
                data: reply
            });
        };
        events[data.id] = eventFunction;
        socket.on(data.event, eventFunction);
    }

    if (data.type === 'unobserve') {
        var _eventFunction = events[data.id];
        if (socket != null) {
            socket.removeListener(data.event, _eventFunction);
        }
        delete events[data.id];
    }

    if (data.type === 'subscribe') {
        var _socket;

        (_socket = socket).emit.apply(_socket, ['subscribe', data.event].concat(_toConsumableArray(data.values)));
    }

    if (data.type === 'send') {
        socket.send(data.message, function (reply) {
            doPostMessage({
                type: 'sendReply',
                reply: reply,
                id: data.id
            });
        });
    }
};

function doPostMessage(data) {
    /* $FlowIssue worker postMessage missing */
    postMessage(JSON.stringify(data));
}