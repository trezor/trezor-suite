'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.deriveDateFormats = deriveDateFormats;


// Functions for date formatting
function deriveDateFormats(t) {
    if (t == null) {
        return {
            dateInfo: null,
            dateInfoDayFormat: null,
            dateInfoTimeFormat: null
        };
    } else {
        var t_ = t;
        var date = new Date(t_ * 1000);
        return {
            dateInfo: date.toString(),
            dateInfoDayFormat: dateToDayFormat(date),
            dateInfoTimeFormat: dateToTimeFormat(date)
        };
    }
}

function dateToTimeFormat(date) {
    var hh = addZero(date.getHours().toString());
    var mm = addZero(date.getMinutes().toString());
    var ss = addZero(date.getSeconds().toString());
    return hh + ':' + mm + ':' + ss;
}

function dateToDayFormat(date) {
    var yyyy = date.getFullYear().toString();
    var mm = addZero((date.getMonth() + 1).toString()); // getMonth() is zero-based
    var dd = addZero(date.getDate().toString());
    return yyyy + '-' + mm + '-' + dd;
}

function addZero(s) {
    if (s.length === 1) {
        return '0' + s;
    }
    return s;
}