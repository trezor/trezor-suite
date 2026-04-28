import { makeFormatter } from '../makeFormatter';

const REGEXP_ADDRESS = /^(0x)?((.{8})(?:.{4})*(.{5,8}))$/;
const TRUNCATION_PLACEHOLDER = '...';

const addSpacing = (value?: string) => value?.match(/.{1,4}/g)?.join(' ') ?? value;

export type AddressFormat = 'full' | 'long' | 'short';
export type AddressFormatterDataContext = { format?: AddressFormat; isChunked?: boolean };

export const AddressFormatter = makeFormatter<string, string, AddressFormatterDataContext>(
    (value, { format = 'full', isChunked = true }) => {
        const match = value.match(REGEXP_ADDRESS);

        if (!match) return value;

        const [, prefix, rest, beginning, end] = isChunked
            ? match.map(part => addSpacing(part))
            : match;

        const parts = (() => {
            switch (format) {
                case 'full':
                    return [prefix, rest];
                case 'long':
                    return [prefix, beginning, TRUNCATION_PLACEHOLDER, end];
                case 'short':
                    return [prefix, beginning?.split(' ')[0], TRUNCATION_PLACEHOLDER, end];
            }
        })();

        return parts.filter(Boolean).join(isChunked ? ' ' : '');
    },
    'AddressFormatter',
);
