import { TRANSFER_TOPIC } from './constants';
import { parseTransferLog } from './transferLog';

const FROM = '0x1111111111111111111111111111111111111111';
const TO = '0x2222222222222222222222222222222222222222';
const CONTRACT = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

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
