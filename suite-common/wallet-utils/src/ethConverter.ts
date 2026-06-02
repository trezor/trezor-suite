import type {
    DecimalString,
    Ether,
    Gwei,
    HexString,
    IntegerString,
    Wei,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

interface EthValue {
    toWei(format: 'hex'): Wei & HexString;
    toWei(format: 'bignumber'): Wei & BigNumber;
    toWei(format?: 'string'): Wei & IntegerString;
    toGwei(format: 'bignumber'): Gwei & BigNumber;
    toGwei(format?: 'string'): Gwei & DecimalString;
    toEther(format: 'bignumber'): Ether & BigNumber;
    toEther(format?: 'string'): Ether & DecimalString;
}

const GWEI = new BigNumber('1e9');
const ETHER = new BigNumber('1e18');

const error = (value: unknown, reason: string) =>
    new Error(`Value '${value}' is invalid (${reason})`);

const toHex = (value: BigNumber): HexString => `0x${value.toString(16)}`;

const toBN = (value: string | bigint, assertInteger?: boolean) => {
    const bn = new BigNumber(value);

    if (bn.isNaN()) throw error(value, 'not a number');
    if (bn.isNegative()) throw error(value, 'negative');
    if (!bn.isFinite()) throw error(value, 'infinity');
    if (!bn.isInteger() && assertInteger) throw error(value, 'decimal');

    return bn;
};

const convertUnit = (wei: BigNumber) =>
    ({
        toWei: ((format = 'string') => {
            switch (format) {
                case 'hex':
                    return toHex(wei);
                case 'bignumber':
                    return wei;
                case 'string':
                    return wei.toString();
            }
        }) as EthValue['toWei'],
        toGwei: (format = 'string') => {
            const gwei = wei.div(GWEI);
            switch (format) {
                case 'bignumber':
                    return gwei;
                case 'string':
                    return gwei.toString();
            }
        },
        toEther: (format = 'string') => {
            const ether = wei.div(ETHER);
            switch (format) {
                case 'bignumber':
                    return ether;
                case 'string':
                    return ether.toString();
            }
        },
    }) as EthValue;

const convertFormat = (value: BigNumber) => ({
    toHex: () => toHex(value),
    toBigNumber: () => value,
    toIntegerString: () => value.toString(),
    asWei: () => convertUnit(value),
});

// TODO input amounts should be branded as well, but it requires broad changes over the whole monorepo

export const fromWei = (wei: string) => convertUnit(toBN(wei, true));

export const fromGwei = (gwei: string) => convertUnit(toBN(gwei).times(GWEI).integerValue());

export const fromEther = (ether: string) => convertUnit(toBN(ether).times(ETHER).integerValue());

export const fromHex = (hex: HexString) => convertFormat(toBN(hex, true));

export const fromBigInt = (value: bigint) => convertFormat(toBN(value, true));

export const fromIntegerString = (value: string) => convertFormat(toBN(value, true));
