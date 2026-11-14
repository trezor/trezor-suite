import {
    SignatureFormatNotSupportedError,
    type SignatureFormatNotSupportedErrorType,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

export const CARDANO_SIGNATURE_FORMATS = ['raw', 'cose'] as const;

export type CardanoSignatureFormat = (typeof CARDANO_SIGNATURE_FORMATS)[number];

export const CARDANO_DEFAULT_SIGNATURE_FORMAT: CardanoSignatureFormat = 'raw';

// TODO: Hack: the shared contract passes any network's SignatureFormat, so Cardano narrows it back
// to its own formats at runtime. Remove as https://github.com/trezor/trezor-suite/issues/32472
// progresses.
export const toCardanoSignatureFormat = (
    format: string | undefined,
): Result<CardanoSignatureFormat, SignatureFormatNotSupportedErrorType> => {
    if (format === undefined) {
        return ok(CARDANO_DEFAULT_SIGNATURE_FORMAT);
    }

    if (!isArrayMember(format, CARDANO_SIGNATURE_FORMATS)) {
        return err(SignatureFormatNotSupportedError(format));
    }

    return ok(format);
};
