/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype';

const definedMessages: Messages = defineMessages({
    TR_ACQUIRE_DEVICE_ERROR: {
        id: 'TR_ACQUIRE_DEVICE_ERROR',
        defaultMessage: 'Acquire device error',
    },
    TR_AUTHENTICATION_ERROR: {
        id: 'TR_AUTHENTICATION_ERROR',
        defaultMessage: 'Authentication error',
    },
    TR_ACCOUNT_DISCOVERY_ERROR: {
        id: 'TR_ACCOUNT_DISCOVERY_ERROR',
        defaultMessage: 'Account discovery error',
        description: 'Error during account discovery',
    },
    TR_TRANSACTION_ERROR: {
        id: 'TR_TRANSACTION_ERROR',
        defaultMessage: 'Transaction error',
        description: 'Error during signing transaction',
    },
    TR_TRANSACTION_SUCCESS: {
        id: 'TR_TRANSACTION_SUCCESS',
        defaultMessage: 'Transaction has been sent successfully',
    },
    TR_SEE_TRANSACTION_DETAILS: {
        id: 'TR_SEE_TRANSACTION_DETAILS',
        defaultMessage: 'See transaction details',
    },
    TR_VERIFYING_ADDRESS_ERROR: {
        id: 'TR_VERIFYING_ADDRESS_ERROR',
        defaultMessage: 'Verifying address error',
    },
    TR_SIGN_MESSAGE_ERROR: {
        id: 'TR_SIGN_MESSAGE_ERROR',
        defaultMessage: 'Sign error',
    },
    TR_VERIFY_MESSAGE_ERROR: {
        id: 'TR_VERIFY_MESSAGE_ERROR',
        defaultMessage: 'Verify error',
    },
    TR_VERIFY_MESSAGE_SUCCESS: {
        id: 'TR_VERIFY_MESSAGE_SUCCESS',
        defaultMessage: 'Message has been successfully verified',
    },
    TR_SIGNATURE_IS_VALID: {
        id: 'TR_SIGNATURE_IS_VALID',
        defaultMessage: 'Signature is valid',
    },
});

export default definedMessages;
