import {
    encodeAbiParameters,
    erc20Abi,
    getAbiItem,
    parseAbiItem,
    parseAbiParameters,
    toEventSelector,
} from 'viem';

import { decodeEventLogAs } from './eventLog';

const SENDER = '0x1111111111111111111111111111111111111111';
const RECIPIENT = '0x2222222222222222222222222222222222222222';
const POOL = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

const UNISWAP_V3_SWAP = parseAbiItem(
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
);
const TRANSFER = getAbiItem({ abi: erc20Abi, name: 'Transfer' });

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;

const swapLog = {
    address: POOL,
    topics: [toEventSelector(UNISWAP_V3_SWAP), topic(SENDER), topic(RECIPIENT)],
    data: encodeAbiParameters(parseAbiParameters('int256, int256, uint160, uint128, int24'), [
        -12n,
        10_000n,
        2n ** 96n,
        1n,
        -5,
    ]),
};

describe(decodeEventLogAs.name, () => {
    it('decodes a log as the event its ABI describes, signed values included', () => {
        expect(decodeEventLogAs(UNISWAP_V3_SWAP, swapLog)).toEqual({
            eventName: 'Swap',
            args: {
                sender: SENDER,
                recipient: RECIPIENT,
                amount0: -12n,
                amount1: 10_000n,
                sqrtPriceX96: 2n ** 96n,
                liquidity: 1n,
                tick: -5,
            },
        });
    });

    it('rejects a log of another event even when its layout fits', () => {
        expect(decodeEventLogAs(TRANSFER, swapLog)).toBeUndefined();
    });

    it('rejects a log whose topic count differs from what the event indexes', () => {
        expect(
            decodeEventLogAs(UNISWAP_V3_SWAP, {
                ...swapLog,
                topics: [...swapLog.topics, topic(SENDER)],
            }),
        ).toBeUndefined();
    });

    it('rejects a log with a missing or non-hex topic rather than throwing', () => {
        const [selector, sender] = swapLog.topics;

        expect(
            decodeEventLogAs(UNISWAP_V3_SWAP, { ...swapLog, topics: [selector, sender, null] }),
        ).toBeUndefined();
        expect(
            decodeEventLogAs(UNISWAP_V3_SWAP, { ...swapLog, topics: [selector, sender, 'zz'] }),
        ).toBeUndefined();
    });
});
