// This is inspired from https://github.com/bitcoinjs/bolt11
// But simplified and adapt to typescript.

import { bech32 } from 'bech32';
import BigNumber from 'bignumber.js';

type MultiplierLetter = 'm' | 'u' | 'n' | 'p';

const DIVISORS = {
    m: new BigNumber(1e3, 10), // (milli): multiply by 0.001
    u: new BigNumber(1e6, 10), // (micro): multiply by 0.000001
    n: new BigNumber(1e9, 10), // (nano): multiply by 0.000000001
    p: new BigNumber(1e12, 10),// (pico): multiply by 0.000000000001
};

const MAX_MILLISATS = new BigNumber('2100000000000000000', 10);

const MILLISATS_PER_BTC = new BigNumber(1e11, 10);
const SATS_PER_BTC = new BigNumber(1e8, 10);

// defaults for encode; default timestamp is current time at call
const DEFAULTNETWORK = {
    // default network is bitcoin
    bech32: 'bc',
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    validWitnessVersions: [0, 1],
};
const TESTNETWORK = {
    bech32: 'tb',
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    validWitnessVersions: [0, 1],
};
const REGTESTNETWORK = {
    bech32: 'bcrt',
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    validWitnessVersions: [0, 1],
};

interface Bech32Result {
    version: number;
    prefix: string;
    data: Buffer;
}

function convert(data: number[], inBits: number, outBits: number) {
    let value = 0;
    let bits = 0;
    // eslint-disable-next-line no-bitwise
    const maxV = (1 << outBits) - 1;

    const result = [];
    for (let i = 0; i < data.length; ++i) {
        // eslint-disable-next-line no-bitwise
        value = (value << inBits) | data[i];
        bits += inBits;

        while (bits >= outBits) {
            bits -= outBits;
            // eslint-disable-next-line no-bitwise
            result.push((value >> bits) & maxV);
        }
    }

    if (bits > 0) {
        // eslint-disable-next-line no-bitwise
        result.push((value << (outBits - bits)) & maxV);
    }

    return result;
}

function wordsToBuffer(words: number[], trim: boolean) {
    let buffer = Buffer.from(convert(words, 5, 8));
    if (trim && (words.length * 5) % 8 !== 0) {
        buffer = buffer.slice(0, -1);
    }
    return buffer;
}

function humanReadablePartToMillisat (humanReadableValue: string, multiplierLetter: MultiplierLetter) {
    const value = humanReadableValue;

    if (!value.match(/^\d+$/)) throw new Error('Not a valid human readable amount')

    const valueBN = new BigNumber(value, 10)

    const millisatoshisBN = multiplierLetter
      ? valueBN.times(MILLISATS_PER_BTC).div(DIVISORS[multiplierLetter])
      : valueBN.times(MILLISATS_PER_BTC)

    if (((multiplierLetter === 'p' && !valueBN.mod(new BigNumber(10, 10)).eq(new BigNumber(0, 10))) ||
        millisatoshisBN.gt(MAX_MILLISATS))) {
      throw new Error('Amount is outside of valid range')
    }

    return millisatoshisBN
  }

function humanReadablePartToSat (humanReadableValue: string, multiplierLetter: MultiplierLetter) {
    const millisatoshisBN = humanReadablePartToMillisat(humanReadableValue, multiplierLetter);
    if (!millisatoshisBN.mod(new BigNumber(1000, 10)).eq(new BigNumber(0, 10))) {
      throw new Error('Amount is outside of valid range')
    }
    const result = millisatoshisBN.div(new BigNumber(1000, 10));
    return result;
}

export const decodePaymentRequest = (paymentRequest: string, network?: string) => {
    if (typeof paymentRequest !== 'string') {
        throw new Error('Lightning Payment Request must be string');
    }
    if (paymentRequest.slice(0, 2).toLowerCase() !== 'ln') {
        throw new Error('Not a proper lightning payment request');
    }
    const decoded: Bech32Result = bech32.decode(paymentRequest, Number.MAX_SAFE_INTEGER);

    paymentRequest = paymentRequest.toLowerCase();
    const { prefix } = decoded;
    let { words } = decoded;

    // signature is always 104 words on the end
    // cutting off at the beginning helps since there's no way to tell
    // ahead of time how many tags there are.
    const sigWords = words.slice(-104);
    // grabbing a copy of the words for later, words will be sliced as we parse.
    const wordsNoSig = words.slice(0, -104);
    words = words.slice(0, -104);

    let sigBuffer = wordsToBuffer(sigWords, true);
    const recoveryFlag = sigBuffer.slice(-1)[0];
    sigBuffer = sigBuffer.slice(0, -1);

    if (!(recoveryFlag in [0, 1, 2, 3]) || sigBuffer.length !== 64) {
        throw new Error('Signature is missing or incorrect');
    }

    let prefixMatches = prefix.match(/^ln(\S+?)(\d*)([a-zA-Z]?)$/);
    if (prefixMatches && !prefixMatches[2]) prefixMatches = prefix.match(/^ln(\S+)$/);
    if (!prefixMatches) {
        throw new Error('Not a proper lightning payment request');
    }
    const bech32Prefix = prefixMatches[1];
    let coinNetwork;
    if (!network) {
        switch (bech32Prefix) {
            case DEFAULTNETWORK.bech32:
                coinNetwork = DEFAULTNETWORK;
                break;
            case TESTNETWORK.bech32:
                coinNetwork = TESTNETWORK;
                break;
            case REGTESTNETWORK.bech32:
                coinNetwork = REGTESTNETWORK;
                break;
            default:
                // TODO: find other solution to handle this situation
                return undefined;
        }
    }

    if (!coinNetwork || coinNetwork.bech32 !== bech32Prefix) {
        throw new Error('Unknown coin bech32 prefix');
    }

    const value = prefixMatches[2];

    let satoshis: BigNumber | null;
    let millisatoshis: BigNumber | null;
    let bitcoins: BigNumber | null;
    if (value) {
        // TODO: check that it is one of the valid MultiplierLetter
        const multiplierLetter: MultiplierLetter = prefixMatches[3] as MultiplierLetter;
        try {
          satoshis = humanReadablePartToSat(value, multiplierLetter);
          bitcoins = satoshis.dividedBy(SATS_PER_BTC);
        } catch (e) {
          satoshis = null;
          bitcoins = null;
        }
        millisatoshis = humanReadablePartToMillisat(value, multiplierLetter);
    } else {
        satoshis = null;
        millisatoshis = null;
        bitcoins = null;
    }

    const finalResult = {
        paymentRequest,
        complete: true,
        prefix,
        wordsTemp: bech32.encode('temp', wordsNoSig.concat(sigWords), Number.MAX_SAFE_INTEGER),
        network: coinNetwork,
        satoshis: satoshis?.toString(),
        bitcoins: bitcoins?.toString(),
        millisatoshis: millisatoshis?.toString(),
        signature: sigBuffer.toString('hex'),
        recoveryFlag,
        // timestamp,
        // timestampString,
        // payeeNodeKey: sigPubkey.toString('hex'),
        // tags
    };
    console.log('finalResult', finalResult);


    return finalResult;
};
