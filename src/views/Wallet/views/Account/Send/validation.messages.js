/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype';

const definedMessages: Messages = defineMessages({
    TR_AMOUNT_IS_NOT_SET: {
        id: 'TR_AMOUNT_IS_NOT_SET',
        defaultMessage: 'Amount is not set',
    },
    TR_AMOUNT_IS_NOT_A_NUMBER: {
        id: 'TR_AMOUNT_IS_NOT_A_NUMBER',
        defaultMessage: 'Amount is not a number',
    },
    TR_MAXIMUM_DECIMALS_ALLOWED: {
        id: 'TR_AMOUNT_IS_NOT_A_NUMBER',
        defaultMessage: 'Maximum {decimals} decimals allowed',
    },
    TR_NOT_ENOUGH_FUNDS_TO_COVER_TRANSACTION: {
        id: 'TR_NOT_ENOUGH_FUNDS_TO_COVER_TRANSACTION',
        defaultMessage: 'Not enough {networkSymbol} to cover transaction fee',
    },
    TR_NOT_ENOUGH_FUNDS: {
        id: 'TR_NOT_ENOUGH_FUNDS',
        defaultMessage: 'Not enough funds',
    },
    TR_AMOUNT_IS_TOO_LOW: {
        id: 'TR_AMOUNT_IS_TOO_LOW',
        defaultMessage: 'Amount is too low',
    },
    TR_ADDRESS_IS_NOT_SET: {
        id: 'TR_ADDRESS_IS_NOT_SET',
        defaultMessage: 'Address is not set',
    },
    TR_ADDRESS_IS_NOT_VALID: {
        id: 'TR_ADDRESS_IS_NOT_VALID',
        defaultMessage: 'Address is not valid',
    },
    TR_ADDRESS_CHECKSUM_IS_NOT_VALID: {
        id: 'TR_ADDRESS_CHECKSUM_IS_NOT_VALID',
        defaultMessage: 'Address checksum is not valid',
    },
    TR_GAS_LIMIT_IS_NOT_SET: {
        id: 'TR_GAS_LIMIT_IS_NOT_SET',
        defaultMessage: 'Gas limit is not set',
    },
    TR_GAS_LIMIT_IS_NOT_A_NUMBER: {
        id: 'TR_GAS_LIMIT_IS_NOT_A_NUMBER',
        defaultMessage: 'Gas limit is not a number',
    },
    TR_GAS_LIMIT_IS_TOO_LOW: {
        id: 'TR_GAS_LIMIT_IS_TOO_LOW',
        defaultMessage: 'Gas limit is too low',
    },
    TR_GAS_LIMIT_IS_BELOW_RECOMMENDED: {
        id: 'TR_GAS_LIMIT_IS_BELOW_RECOMMENDED',
        defaultMessage: 'Gas limit is below recommended',
    },
    TR_GAS_PRICE_IS_NOT_A_NUMBER: {
        id: 'TR_GAS_PRICE_IS_NOT_A_NUMBER',
        defaultMessage: 'Gas price is not a number',
    },
    TR_GAS_PRICE_IS_NOT_SET: {
        id: 'TR_GAS_PRICE_IS_NOT_SET',
        defaultMessage: 'Gas price is not set',
    },
    TR_GAS_PRICE_IS_TOO_LOW: {
        id: 'TR_GAS_PRICE_IS_TOO_LOW',
        defaultMessage: 'Gas price is too low',
    },
    TR_GAS_PRICE_IS_TOO_HIGH: {
        id: 'TR_GAS_PRICE_IS_TOO_HIGH',
        defaultMessage: 'Gas price is too high',
    },
    TR_NONCE_IS_NOT_A_NUMBER: {
        id: 'TR_NONCE_IS_NOT_A_NUMBER',
        defaultMessage: 'Nonce is not a valid number',
    },
    TR_NONCE_IS_NOT_SET: {
        id: 'TR_NONCE_IS_NOT_SET',
        defaultMessage: 'Nonce is not set',
    },
    TR_NONCE_IS_GREATER_THAN_RECOMMENDED: {
        id: 'TR_NONCE_IS_GREATER_THAN_RECOMMENDED',
        defaultMessage: 'Nonce is greater than recommended',
    },
    TR_NONCE_IS_LOWER_THAN_RECOMMENDED: {
        id: 'TR_NONCE_IS_LOWER_THAN_RECOMMENDED',
        defaultMessage: 'Nonce is lower than recommended',
    },
    TR_DATA_IS_NOT_VALID_HEX: {
        id: 'TR_DATA_IS_NOT_VALID_HEX',
        defaultMessage: 'Data is not valid hexadecimal',
    },
    TR_CANNOT_SEND_TO_MYSELF: {
        id: 'TR_CANNOT_SEND_TO_MYSELF',
        defaultMessage: 'Cannot send to myself',
    },
    TR_NOT_ENOUGH_FUNDS_RESERVED_AMOUNT: {
        id: 'TR_NOT_ENOUGH_FUNDS_RESERVED_AMOUNT',
        defaultMessage:
            'Not enough funds. Reserved amount for this account is {reservedAmount} {networkSymbol}',
    },
    TR_AMOUNT_IS_TOO_LOW_MINIMUM_AMOUNT_FOR_CREATING: {
        id: 'TR_AMOUNT_IS_TOO_LOW_MINIMUM_AMOUNT_FOR_CREATING',
        defaultMessage:
            'Amount is too low. Minimum amount for creating a new account is {minimalAmount} {networkSymbol}',
    },
    TR_FEE_IS_NOT_SET: {
        id: 'TR_FEE_IS_NOT_SET',
        defaultMessage: 'Fee is not set',
    },
    TR_FEE_MUST_ME_AN_ABSOLUT_NUMBER: {
        id: 'TR_FEE_MUST_ME_AN_ABSOLUT_NUMBER',
        defaultMessage: 'Fee must be an absolute number',
    },
    TR_FEE_IS_BELOW_RECOMMENDED: {
        id: 'TR_FEE_IS_BELOW_RECOMMENDED',
        defaultMessage: 'Fee is below recommended',
    },
    TR_FEE_IS_ABOVE_RECOMMENDED: {
        id: 'TR_FEE_IS_ABOVE_RECOMMENDED',
        defaultMessage: 'Fee is above recommended',
    },
    TR_DESTINATION_TAG_MUST_BE_AN_ABSOLUTE: {
        id: 'TR_DESTINATION_TAG_MUST_BE_AN_ABSOLUTE',
        defaultMessage: 'Destination tag must be an absolute number',
    },
    TR_DESTINATION_TAG_IS_NOT_VALID: {
        id: 'TR_DESTINATION_TAG_IS_NOT_VALID',
        defaultMessage: 'Destination tag is not valid',
    },
});

export default definedMessages;
