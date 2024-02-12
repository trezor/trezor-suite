global.Buffer = require('buffer').Buffer;

global.process = {
    ...require('process'),
    // necessary to prevent overriding env variables
    env: process.env,
};

// There is bug in buffer polyfill that when you call subarray it returns Uint8Array instead of Buffer, this fixes it
// It's basically copy pasted slice method from buffer polyfill with one change in line `const newBuf...`
// TODO: replace with @craftzdog/react-native-buffer so we can remove this override
Buffer.prototype.subarray = function subarray(start, end) {
    const len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
        start += len;
        if (start < 0) start = 0;
    } else if (start > len) {
        start = len;
    }

    if (end < 0) {
        end += len;
        if (end < 0) end = 0;
    } else if (end > len) {
        end = len;
    }

    if (end < start) end = start;

    const newBuf = Uint8Array.prototype.subarray.call(this, start, end);

    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(newBuf, Buffer.prototype);

    return newBuf;
};

global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
