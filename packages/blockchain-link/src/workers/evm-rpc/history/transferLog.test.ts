import { TRANSFER_TOPIC } from './constants';
import { parseTransferLog } from './transferLog';

const FROM = '0x1111111111111111111111111111111111111111';
const TO = '0x2222222222222222222222222222222222222222';
const CONTRACT = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
// Swap(address,address,int256,int256,uint160,uint128,int24)
const UNISWAP_V3_SWAP_TOPIC = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67';

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;

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

    it('ignores another event of the same shape, such as a Uniswap V3 swap', () => {
        expect(
            parseTransferLog({
                address: CONTRACT,
                topics: [UNISWAP_V3_SWAP_TOPIC, topic(FROM), topic(TO)],
                // The int256 amount0 of a pool paying out 12 units.
                data: `0x${(2n ** 256n - 12n).toString(16)}${'0'.repeat(63)}1`,
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
