/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_GAS_LIMIT: {
        id: 'TR_GAS_LIMIT',
        defaultMessage: 'Gas limit',
    },
    TR_GAS_LIMIT_REFERS_TO: {
        id: 'TR_GAS_LIMIT_REFERS_TO',
        defaultMessage: 'Gas limit refers to the maximum amount of gas user is willing to spendon a particular transaction. {TR_GAS_QUOTATION}. Increasing the gas limit will not get the transaction confirmed sooner. Default value for sending {gasLimitTooltipCurrency} is {gasLimitTooltipValue}.',
    },
    TR_GAS_QUOTATION: {
        id: 'TR_GAS_QUOTATION',
        defaultMessage: 'Transaction fee = gas limit * gas price',
    },
    TR_SET_DEFAULT: {
        id: 'TR_SET_DEFAULT',
        defaultMessage: 'Set default',
    },
    TR_CALCULATING_DOT_DOT: {
        id: 'TR_CALCULATING_DOT_DOT',
        defaultMessage: 'Calculating...',
        description: 'Used when calculating gas limit based on data input in ethereum advanced send form',
    },
    TR_GAS_PRICE: {
        id: 'TR_GAS_PRICE',
        defaultMessage: 'Gas price',
    },
    TR_GAS_PRICE_REFERS_TO: {
        id: 'TR_GAS_PRICE_REFERS_TO',
        defaultMessage: 'Gas price refers to the amount of ether you are willing to pay for every unit of gas, and is usually measured in “Gwei”. {TR_GAS_PRICE_QUOTATION}. Increasing the gas price will get the transaction confirmed sooner but makes it more expensive. The recommended gas price is {recommendedGasPrice} GWEI.',
    },
    TR_GAS_PRICE_QUOTATION: {
        id: 'TR_GAS_PRICE_QUOTATION',
        defaultMessage: 'Transaction fee = gas limit * gas price',
    },
    TR_DATA: {
        id: 'TR_DATA',
        defaultMessage: 'Data',
    },
    TR_DATA_IS_USUALLY_USED: {
        id: 'TR_DATA_IS_USUALLY_USED',
        defaultMessage: 'Data is usually used when you send transactions to contracts.',
    },
});

export default definedMessages;