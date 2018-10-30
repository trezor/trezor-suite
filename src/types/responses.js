/* @flow */

import * as RESPONSES from '../constants/responses';

export type Response = {
    +type: typeof RESPONSES.INIT,
} | {
    +type: typeof RESPONSES.ERROR,
    +info: string,
} | {
    +type: typeof RESPONSES.INFO,
    +info: any,
} | {
    +type: typeof RESPONSES.ACCOUNT_INFO,
    +info: any,
} | {
    +type: typeof RESPONSES.SUBSCRIBE,
    +info: any,
} | {
    +type: typeof RESPONSES.NOTIFICATION,
    +info: any,
};