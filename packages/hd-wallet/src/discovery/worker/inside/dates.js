/* @flow */
import type { TransactionInfo } from '../../index';

// Functions for date formatting
export function deriveDateFormats(
    t: ?number,
    wantedOffset: number, // what (new Date().getTimezoneOffset()) returns
): {
    timestamp: ?number,
    dateInfoDayFormat: ?string,
    dateInfoTimeFormat: ?string,
} {
    if (t == null) {
        return {
            timestamp: null,
            dateInfoDayFormat: null,
            dateInfoTimeFormat: null,
        };
    }
    const t_: number = t;
    const date = new Date((t_ - wantedOffset * 60) * 1000);
    return {
        timestamp: t_,
        dateInfoDayFormat: dateToDayFormat(date),
        dateInfoTimeFormat: dateToTimeFormat(date),
    };
}

function dateToTimeFormat(date: Date): string {
    const hh = addZero(date.getUTCHours().toString());
    const mm = addZero(date.getUTCMinutes().toString());
    const ss = addZero(date.getUTCSeconds().toString());
    return `${hh}:${mm}:${ss}`;
}

function dateToDayFormat(date: Date): string {
    const yyyy = date.getUTCFullYear().toString();
    const mm = addZero((date.getUTCMonth() + 1).toString()); // getMonth() is zero-based
    const dd = addZero(date.getUTCDate().toString());
    return `${yyyy}-${mm}-${dd}`;
}

function addZero(s: string): string {
    if (s.length === 1) {
        return `0${s}`;
    }
    return s;
}

export function recomputeDateFormats(
    ts: Array<TransactionInfo>,
    wantedOffset: number,
) {
    ts.forEach((t) => {
        const r = deriveDateFormats(t.timestamp, wantedOffset);
        // eslint-disable-next-line no-param-reassign
        t.dateInfoDayFormat = r.dateInfoDayFormat;
        // eslint-disable-next-line no-param-reassign
        t.dateInfoTimeFormat = r.dateInfoTimeFormat;
    });
}
