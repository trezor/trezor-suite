/* @flow */

// Functions for date formatting
export function deriveDateFormats(t: ?number): {
    dateInfo: ?string,
    dateInfoDayFormat: ?string,
    dateInfoTimeFormat: ?string,
} {
    if (t == null) {
        return {
            dateInfo: null,
            dateInfoDayFormat: null,
            dateInfoTimeFormat: null,
        };
    } else {
        const t_: number = t;
        const date = new Date(t_ * 1000);
        return {
            dateInfo: date.toString(),
            dateInfoDayFormat: dateToDayFormat(date),
            dateInfoTimeFormat: dateToTimeFormat(date),
        };
    }
}

function dateToTimeFormat(date: Date): string {
    const hh = addZero(date.getHours().toString());
    const mm = addZero(date.getMinutes().toString());
    const ss = addZero(date.getSeconds().toString());
    return hh + ':' + mm + ':' + ss;
}

function dateToDayFormat(date: Date): string {
    const yyyy = date.getFullYear().toString();
    const mm = addZero((date.getMonth() + 1).toString()); // getMonth() is zero-based
    const dd = addZero(date.getDate().toString());
    return yyyy + '-' + mm + '-' + dd;
}

function addZero(s: string): string {
    if (s.length === 1) {
        return '0' + s;
    }
    return s;
}
