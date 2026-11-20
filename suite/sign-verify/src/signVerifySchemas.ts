import { type TranslationKey } from '@suite/intl';
import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { isHex } from '@trezor/utils';
import { z } from '@trezor/zod';

import { type SignVerifyValues } from './SignVerifyContext';

const REQUIRED: TranslationKey = 'TR_REQUIRED_FIELD';

const message = z.string().min(1, REQUIRED).max(MAX_LENGTH_MESSAGE, 'TR_TOO_LONG');

const isMessageHexValid = ({ message: value, hex }: SignVerifyValues) =>
    !hex || value === '' || isHex(value, { prefix: 'optional', allowEmpty: false });

const hexMessageIssue = {
    message: 'DATA_NOT_VALID_HEX' satisfies TranslationKey,
    path: ['message'],
    // The check needs the Hex switch next to the message, so it must not wait for the other fields.
    when: () => true,
};

export const signSchema = z
    .object({
        path: z.string().min(1, REQUIRED),
        address: z.string(),
        message,
        hex: z.boolean(),
        signature: z.string(),
        pubKey: z.string(),
        format: z.string(),
    })
    .refine(isMessageHexValid, hexMessageIssue);

export const createVerifySchema = (isAddressValid: (address: string) => boolean) =>
    z
        .object({
            path: z.string(),
            address: z
                .string()
                .refine(isAddressValid, 'TR_ADD_TOKEN_ADDRESS_NOT_VALID' satisfies TranslationKey),
            message,
            hex: z.boolean(),
            signature: z.string().min(1, REQUIRED),
            pubKey: z.string(),
            format: z.string(),
        })
        .refine(isMessageHexValid, hexMessageIssue);
