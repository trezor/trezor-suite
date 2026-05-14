import { parseUnsignedEvmTransaction } from '../../verification/schema';

const APPROVAL_UNSIGNED_TX =
    '{"from":"0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3","gasLimit":"0xe563","to":"0xdac17f958d2ee523a2206206994597c13d831ec7","data":"0x095ea7b3000000000000000000000000beef047a543e45807105e51a8bbefcc5950fcfba00000000000000000000000000000000000000000000000000000000000f4240","nonce":664,"type":2,"maxFeePerGas":"0x0ee6b280","maxPriorityFeePerGas":"0x054e0840","chainId":1}';

const SUPPLY_UNSIGNED_TX =
    '{"from":"0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3","gasLimit":"0x124f80","to":"0xbEef047a543E45807105E51A8BBEFCc5950fcfBa","data":"0x6e553f6500000000000000000000000000000000000000000000000000000000000f42400000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3","nonce":664,"type":2,"maxFeePerGas":"0x0ee6b280","maxPriorityFeePerGas":"0x054e0840","chainId":1}';

describe('parseUnsignedEvmTransaction', () => {
    it('parses a valid approval transaction', () => {
        const result = parseUnsignedEvmTransaction(APPROVAL_UNSIGNED_TX);

        expect(result).toEqual({
            from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
            to: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            data: '0x095ea7b3000000000000000000000000beef047a543e45807105e51a8bbefcc5950fcfba00000000000000000000000000000000000000000000000000000000000f4240',
            chainId: 1,
        });
    });

    it('parses a valid supply transaction', () => {
        const result = parseUnsignedEvmTransaction(SUPPLY_UNSIGNED_TX);

        expect(result).toEqual({
            from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
            to: '0xbEef047a543E45807105E51A8BBEFCc5950fcfBa',
            data: '0x6e553f6500000000000000000000000000000000000000000000000000000000000f42400000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3',
            chainId: 1,
        });
    });

    it('returns null for non-string input', () => {
        expect(parseUnsignedEvmTransaction(null)).toBeNull();
        expect(parseUnsignedEvmTransaction(undefined)).toBeNull();
        expect(parseUnsignedEvmTransaction(1)).toBeNull();
    });

    it('returns null for invalid JSON', () => {
        expect(parseUnsignedEvmTransaction('not-json')).toBeNull();
        expect(parseUnsignedEvmTransaction('{invalid')).toBeNull();
    });

    it.each(['from', 'to', 'data'])('returns null when %s field missing 0x prefix', field => {
        const tx = JSON.parse(APPROVAL_UNSIGNED_TX);
        tx[field] = tx[field].slice(2);
        const result = parseUnsignedEvmTransaction(JSON.stringify(tx));

        expect(result).toBeNull();
    });

    it('returns null when required field is missing', () => {
        const tx = JSON.parse(APPROVAL_UNSIGNED_TX);
        delete tx.chainId;
        const result = parseUnsignedEvmTransaction(JSON.stringify(tx));

        expect(result).toBeNull();
    });
});
