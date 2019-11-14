import { defineMessages } from 'react-intl';

const definedMessages = defineMessages({
    CANNOT_SEND_TO_MYSELF: {
        defaultMessage: 'Cannot send to myself',
        id: 'CANNOT_SEND_TO_MYSELF',
    },
    TR_ADD_RECIPIENT: {
        defaultMessage: 'Add recipient',
        id: 'TR_ADD_RECIPIENT',
    },
    TR_ADDRESS_IS_NOT_SET: {
        defaultMessage: 'Address is not set',
        id: 'TR_ADDRESS_IS_NOT_SET',
    },
    TR_ADDRESS_IS_NOT_VALID: {
        defaultMessage: 'Address is not valid',
        id: 'TR_ADDRESS_IS_NOT_VALID',
    },
    TR_ADVANCED_SETTINGS: {
        defaultMessage: 'Advanced settings',
        description: 'Shows advanced sending form',
        id: 'TR_ADVANCED_SETTINGS',
    },
    TR_AMOUNT: {
        defaultMessage: 'Amount',
        id: 'TR_AMOUNT',
    },
    TR_AMOUNT_IS_NOT_ENOUGH: {
        defaultMessage: 'Not enough funds',
        id: 'TR_AMOUNT_IS_NOT_ENOUGH',
    },
    TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS: {
        defaultMessage: 'Maximum {decimals} decimals allowed',
        id: 'TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS',
    },
    TR_AMOUNT_IS_NOT_NUMBER: {
        defaultMessage: 'Amount is not a number',
        id: 'TR_AMOUNT_IS_NOT_NUMBER',
    },
    TR_AMOUNT_IS_NOT_SET: {
        defaultMessage: 'Amount is not set',
        id: 'TR_AMOUNT_IS_NOT_SET',
    },
    TR_BTC: {
        defaultMessage: 'Transfer cost in XRP drops',
        id: 'TR_XRP_TRANSFER_COST',
    },
    TR_CALCULATING_DOT_DOT: {
        defaultMessage: 'Calculating...',
        description:
            'Used when calculating gas limit based on data input in ethereum advanced send form',
        id: 'TR_CALCULATING_DOT_DOT',
    },
    TR_CUSTOM_FEE_IS_NOT_SET: {
        defaultMessage: 'Fee is not set',
        id: 'TR_CUSTOM_FEE_IS_NOT_SET',
    },
    TR_CUSTOM_FEE_IS_NOT_VALID: {
        defaultMessage: 'Fee is not a number',
        id: 'TR_CUSTOM_FEE_IS_NOT_NUMBER',
    },
    TR_CUSTOM_FEE_NOT_IN_RANGE: {
        defaultMessage: 'Allowed fee is between {minFee} and {maxFee}',
        id: 'TR_CUSTOM_FEE_NOT_IN_RANGE',
    },
    TR_DATA: {
        defaultMessage: 'Data',
        id: 'TR_DATA',
    },
    TR_DATA_IS_USUALLY_USED: {
        defaultMessage: 'Data is usually used when you send transactions to contracts.',
        id: 'TR_DATA_IS_USUALLY_USED',
    },
    TR_DESTINATION_TAG_IS_NOT_NUMBER: {
        defaultMessage: 'Destination tag is not a number',
        id: 'TR_DESTINATION_TAG_IS_NOT_NUMBER',
    },
    TR_GAS_LIMIT: {
        defaultMessage: 'Gas limit',
        id: 'TR_GAS_LIMIT',
    },
    TR_GAS_LIMIT_REFERS_TO: {
        defaultMessage:
            'Gas limit refers to the maximum amount of gas user is willing to spend on a particular transaction. {TR_GAS_QUOTATION}. Increasing the gas limit will not get the transaction confirmed sooner. Default value for sending {gasLimitTooltipCurrency} is {gasLimitTooltipValue}.',
        id: 'TR_GAS_LIMIT_REFERS_TO',
    },
    TR_GAS_PRICE: {
        defaultMessage: 'Gas price',
        id: 'TR_GAS_PRICE',
    },
    TR_GAS_PRICE_QUOTATION: {
        defaultMessage: 'Transaction fee = gas limit * gas price',
        id: 'TR_GAS_PRICE_QUOTATION',
    },
    TR_GAS_PRICE_REFERS_TO: {
        defaultMessage:
            'Gas price refers to the amount of ether you are willing to pay for every unit of gas, and is usually measured in “Gwei”. {TR_GAS_PRICE_QUOTATION}. Increasing the gas price will get the transaction confirmed sooner but makes it more expensive. The recommended gas price is {recommendedGasPrice} GWEI.',
        id: 'TR_GAS_PRICE_REFERS_TO',
    },
    TR_GAS_QUOTATION: {
        defaultMessage: 'Transaction fee = gas limit * gas price',
        id: 'TR_GAS_QUOTATION',
    },
    TR_SEND_ERROR: {
        defaultMessage: 'Send {network}',
        id: 'TR_SEND_ERROR',
    },
    TR_SEND_NETWORK: {
        defaultMessage: 'Send {network}',
        id: 'TR_SEND_NETWORK',
    },
    TR_SEND_NETWORK_AND_TOKENS: {
        defaultMessage: 'Send {network} and tokens',
        id: 'TR_SEND_NETWORK_AND_TOKENS',
    },
    TR_SET_DEFAULT: {
        defaultMessage: 'Set default',
        id: 'TR_SET_DEFAULT',
    },
    TR_SET_MAX: {
        defaultMessage: 'Set max',
        description: 'Used for setting maximum amount in Send form',
        id: 'TR_SET_MAX',
    },
    TR_XRP_DESTINATION_TAG: {
        defaultMessage: 'Destination tag',
        id: 'TR_XRP_DESTINATION_TAG',
    },
    TR_XRP_DESTINATION_TAG_EXPLAINED: {
        defaultMessage:
            'Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction.',
        id: 'TR_XRP_DESTINATION_TAG_EXPLAINED',
    },
    TR_XRP_TRANSFER_COST: {
        defaultMessage: 'Transfer cost in XRP drops',
        id: 'TR_XRP_TRANSFER_COST',
    },
    TR_ETH_GAS_LIMIT_NOT_NUMBER: {
        defaultMessage: 'Gas limit is not a number',
        id: 'TR_ETH_GAS_LIMIT_NOT_NUMBER',
    },
    TR_ETH_GAS_PRICE_NOT_NUMBER: {
        defaultMessage: 'Gas price is not a number',
        id: 'TR_ETH_GAS_PRICE_NOT_NUMBER',
    },
    TR_ETH_DATA_NOT_HEX: {
        defaultMessage: 'Data is not valid hexadecimal',
        id: 'TR_ETH_DATA_NOT_HEX',
    },
});

export default definedMessages;
