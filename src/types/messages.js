/* @flow */

import * as MESSAGES from '../constants/messages';

export type Message = {
    +type: typeof MESSAGES.INIT,
} | {
    +type: typeof MESSAGES.GET_INFO,
} | {
    +type: typeof MESSAGES.GET_ACCOUNT_INFO,
    +payload: {
        +type: 'ripple',
        +address: string,
    } | {
        +type: 'blockbook',
        +xpub: string,
    }
};

export type Response = {
    +type: 'account-info',
    +info: any,
};