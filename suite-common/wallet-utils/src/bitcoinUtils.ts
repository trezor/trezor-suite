import { getUnixTime } from 'date-fns';

import { parseUTCdatetime } from '@suite-common/suite-utils';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';

export const datetimeToLocktime = (input: string | undefined): number | undefined => {
    if (input === undefined) return undefined;
    const datetime = parseUTCdatetime(input);
    if (datetime === undefined) return undefined;
    const timestamp = getUnixTime(datetime);

    return BTC_LOCKTIME_VALUE <= timestamp && timestamp <= 0xffffffff ? timestamp : undefined;
};
