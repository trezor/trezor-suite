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

const GWEI_DECIMALS = 9;
const ETHER_DECIMALS = 18;

const error = (value: unknown, reason: string) =>
    new Error(`Value '${value}' is invalid (${reason})`);

const toHex = (value: BigNumber): HexString => `0x${value.toString(16)}`;

const toBN = (value: string | bigint, shift = 0) => {
    const bn = new BigNumber(value);

    if (bn.isNaN()) throw error(value, 'not a number');
    if (bn.isNegative()) throw error(value, 'negative');
    if (!bn.isFinite()) throw error(value, 'infinity');

    const shifted = bn.shiftedBy(shift);

    if (!shifted.isInteger()) throw error(value, `more than ${shift} decimal places`);

    return shifted;
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
            const gwei = wei.shiftedBy(-GWEI_DECIMALS);
            switch (format) {
                case 'bignumber':
                    return gwei;
                case 'string':
                    return gwei.toString();
            }
        },
        toEther: (format = 'string') => {
            const ether = wei.shiftedBy(-ETHER_DECIMALS);
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

export const fromWei = (wei: string) => convertUnit(toBN(wei));

export const fromGwei = (gwei: string) => convertUnit(toBN(gwei, GWEI_DECIMALS));

export const fromEther = (ether: string) => convertUnit(toBN(ether, ETHER_DECIMALS));

export const fromHex = (hex: HexString) => convertFormat(toBN(hex));

export const fromBigInt = (value: bigint) => convertFormat(toBN(value));

export const fromIntegerString = (value: string) => convertFormat(toBN(value));
