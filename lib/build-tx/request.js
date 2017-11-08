'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.splitByCompleteness = splitByCompleteness;
exports.getMax = getMax;
function splitByCompleteness(outputs) {
    var result = {
        complete: [],
        incomplete: []
    };

    outputs.forEach(function (output) {
        if (output.type === 'complete' || output.type === 'send-max' || output.type === 'opreturn') {
            result.complete.push(output);
        } else {
            result.incomplete.push(output);
        }
    });

    return result;
}
// -------- Input to algoritm
// array of Request, which is either
//    - 'complete' - address + amount
//    - 'send-max' - address
//    - 'noaddress' - just amount
//    - 'send-max-noaddress' - no other info

function getMax(outputs) {
    // first, call coinselect - either sendMax or bnb
    // and if the input data are complete, also make the whole transaction

    var countMaxRequests = outputs.filter(function (output) {
        return output.type === 'send-max-noaddress' || output.type === 'send-max';
    });
    if (countMaxRequests.length >= 2) {
        throw new Error('TWO-SEND-MAX');
    }

    var id = outputs.findIndex(function (output) {
        return output.type === 'send-max-noaddress' || output.type === 'send-max';
    });
    var exists = countMaxRequests.length === 1;

    return {
        id: id, exists: exists
    };
}