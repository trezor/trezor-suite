/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';


export const COIN_CHANGE: string = 'action__composetx_coin_change';
export const RESPONSE_TAB_CHANGE: string = 'action__composetx_response_tab_change';

export const OUTPUT_ADD: string = 'action__output_add';
export const OUTPUT_REMOVE: string = 'action__output_remove';
export const OUTPUT_TYPE_CHANGE: string = 'action__output_type_change';
export const OUTPUT_ADDRESS_CHANGE: string = 'action__output_address_change';
export const OUTPUT_AMOUNT_CHANGE: string = 'action__output_amount_change';
export const OUTPUT_SEND_MAX: string = 'action__output_send_max';
export const OPRETURN_DATA_CHANGE: string = 'action__opreturn_data_change';
export const OPRETURN_DATA_FORMAT_CHANGE: string = 'action__opreturn_data_format_change';

export const LOCKTIME_ENABLE: string = 'action__locktime_enable';
export const LOCKTIME_CHANGE: string = 'action__locktime_change';

export const PUSH_CHANGE: string = 'action__send_max_change';
export const COMPOSETX_RESPONSE: string = 'action__composetx_response';


export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onOutputAdd(): any {
    return {
        type: OUTPUT_ADD
    }
}

export function onOutputRemove(index: number): any {
    return {
        type: OUTPUT_REMOVE,
        index
    }
}

export function onOutputTypeChange(index: number, output_type: string): any {
    return {
        type: OUTPUT_TYPE_CHANGE,
        index,
        output_type
    }
}

export function onOutputAddressChange(index: number, address: string): any {
    return {
        type: OUTPUT_ADDRESS_CHANGE,
        index,
        address
    }
}

export function onOutputAmountChange(index: number, amount: number): any {
    return {
        type: OUTPUT_AMOUNT_CHANGE,
        index,
        amount
    }
}

export function onOutputSendMax(index: number, status: boolean): any {
    return {
        type: OUTPUT_SEND_MAX,
        index,
        status
    }
}

export function onOpreturnDataChange(index: number, value: string): any {
    return {
        type: OPRETURN_DATA_CHANGE,
        index,
        value
    }
}

export function onOpreturnDataFormatChange(index: number, status: boolean): any {
    return {
        type: OPRETURN_DATA_FORMAT_CHANGE,
        index,
        status
    }
}

export function onLocktimeEnable(status: boolean): any {
    return {
        type: LOCKTIME_ENABLE,
        status
    }
}

export function onLocktimeChange(value: number): any {
    return {
        type: LOCKTIME_CHANGE,
        value
    }
}

export function onPushChange(value: number): any {
    return {
        type: PUSH_CHANGE,
        value
    }
}

export function onResponseTabChange(tab: string): any {
    return {
        type: RESPONSE_TAB_CHANGE,
        tab
    }
}

export function onComposeTx(params: any): any {
    return async function (dispatch) {
        const response = await TrezorConnect.composeTransaction(params);
        dispatch({
            type: COMPOSETX_RESPONSE,
            response
        });
    }
}