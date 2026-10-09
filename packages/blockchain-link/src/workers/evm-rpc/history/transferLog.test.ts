import {
    encodeAbiParameters,
    erc20Abi,
    getAbiItem,
    maxUint256,
    parseAbiItem,
    parseAbiParameters,
    toEventSelector,
} from 'viem';

import { TRANSFER_TOPIC } from './constants';
import { parseTransferLog } from './transferLog';

const FROM = '0x1111111111111111111111111111111111111111';
const TO = '0x2222222222222222222222222222222222222222';
const CONTRACT = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;

// Events that, like an ERC-20 transfer, index two addresses and lead `data` with a 32-byte word.
const LOOKALIKES = [
    {
        name: 'an ERC-20 approval',
        event: getAbiItem({ abi: erc20Abi, name: 'Approval' }),
        data: encodeAbiParameters(parseAbiParameters('uint256'), [maxUint256]),
    },
    {
        name: 'a Uniswap V3 swap',
        event: parseAbiItem(
            'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
        ),
        data: encodeAbiParameters(parseAbiParameters('int256, int256, uint160, uint128, int24'), [
            -12n,
            10_000n,
            2n ** 96n,
            1n,
            0,
        ]),
    },
    {
        name: 'a Uniswap V2 swap',
        event: parseAbiItem(
            'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
        ),
        data: encodeAbiParameters(parseAbiParameters('uint256, uint256, uint256, uint256'), [
            10_000n,
            0n,
            0n,
            12n,
        ]),
    },
];

describe(parseTransferLog.name, () => {
    it('reads a fungible transfer and lowercases every address', () => {
        expect(
            parseTransferLog({
                address: CONTRACT,
                topics: [TRANSFER_TOPIC, topic(FROM), topic(TO)],
                data: `0x${(1_500_000).toString(16).padStart(64, '0')}`,
            }),
        ).toEqual({
            contract: CONTRACT.toLowerCase(),
            from: FROM.toLowerCase(),
            to: TO.toLowerCase(),
            value: 1_500_000n,
        });
    });

    it('ignores an NFT transfer, which indexes the token id into a fourth topic', () => {
        expect(
            parseTransferLog({
                address: CONTRACT,
                topics: [TRANSFER_TOPIC, topic(FROM), topic(TO), topic('0x01')],
                data: '0x',
            }),
        ).toBeUndefined();
    });

    it.each(LOOKALIKES)('ignores $name, which is laid out like a transfer', ({ event, data }) => {
        expect(
            parseTransferLog({
                address: CONTRACT,
                topics: [toEventSelector(event), topic(FROM), topic(TO)],
                data,
            }),
        ).toBeUndefined();
    });

    it('ignores a log with no amount', () => {
        expect(
            parseTransferLog({
                address: CONTRACT,
                topics: [TRANSFER_TOPIC, topic(FROM), topic(TO)],
                data: '0x',
            }),
        ).toBeUndefined();
    });

    it('ignores an unparsable amount rather than throwing', () => {
        expect(
            parseTransferLog({
                address: CONTRACT,
                topics: [TRANSFER_TOPIC, topic(FROM), topic(TO)],
                data: `0x${'z'.repeat(64)}`,
            }),
        ).toBeUndefined();
    });
});
