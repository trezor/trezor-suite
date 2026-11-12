import { exhaustive } from '@trezor/type-utils';

import { makeFormatter } from '../makeFormatter';

const REGEXP_ADDRESS = /^(0x)?((.{8})(?:.{4})*(.{5,8}))$/;
const TRUNCATION_PLACEHOLDER = '...';
const ADDRESS_CHUNK_LENGTH = 4;

const splitIntoChunks = (value: string): string[] =>
    value.match(new RegExp(`.{1,${ADDRESS_CHUNK_LENGTH}}`, 'g')) ?? [];

export type AddressFormat = 'full' | 'long' | 'short';
export type AddressFormatterDataContext = { format?: AddressFormat; isChunked?: boolean };

export const getAddressChunks = (
    value: string,
    format: AddressFormat = 'full',
): string[] | null => {
    const match = value.match(REGEXP_ADDRESS);

    if (!match) {
        return null;
    }

    const prefix = match[1] ?? '';
    const rest = match[2] ?? '';
    const beginning = match[3] ?? '';
    const end = match[4] ?? '';

    switch (format) {
        case 'full':
            return [...splitIntoChunks(prefix), ...splitIntoChunks(rest)];
        case 'long':
            return [
                ...splitIntoChunks(prefix),
                ...splitIntoChunks(beginning),
                TRUNCATION_PLACEHOLDER,
                ...splitIntoChunks(end),
            ];
        case 'short':
            return [
                ...splitIntoChunks(prefix),
                ...splitIntoChunks(beginning.slice(0, ADDRESS_CHUNK_LENGTH)),
                TRUNCATION_PLACEHOLDER,
                ...splitIntoChunks(end),
            ];
        default:
            return exhaustive(format);
    }
};

export const AddressFormatter = makeFormatter<string, string, AddressFormatterDataContext>(
    (value, { format = 'full', isChunked = true }) => {
        const chunks = getAddressChunks(value, format);

        if (!chunks) {
            return value;
        }

        return chunks.join(isChunked ? ' ' : '');
    },
    'AddressFormatter',
);
