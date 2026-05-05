import { type EnterYieldResponseSuccess, TransactionDtoType } from '../../api';
import { verifyEnterTransactions } from '../../verification/enter';

const YIELD_ID = 'ethereum-usdt-steakusdt-0xbeef047a543e45807105e51a8bbefcc5950fcfba-4626-vault';
const ADDRESS = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
const AMOUNT = '1';
const DECIMALS = 6;

const APPROVAL_UNSIGNED_TX =
    '{"from":"0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3","gasLimit":"0xe563","to":"0xdac17f958d2ee523a2206206994597c13d831ec7","data":"0x095ea7b3000000000000000000000000beef047a543e45807105e51a8bbefcc5950fcfba00000000000000000000000000000000000000000000000000000000000f4240","nonce":664,"type":2,"maxFeePerGas":"0x0ee6b280","maxPriorityFeePerGas":"0x054e0840","chainId":1}';

const SUPPLY_UNSIGNED_TX =
    '{"from":"0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3","gasLimit":"0x124f80","to":"0xbEef047a543E45807105E51A8BBEFCc5950fcfBa","data":"0x6e553f6500000000000000000000000000000000000000000000000000000000000f42400000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3","nonce":664,"type":2,"maxFeePerGas":"0x0ee6b280","maxPriorityFeePerGas":"0x054e0840","chainId":1}';

const mockResponse = (transactions: { type: TransactionDtoType; unsignedTransaction: unknown }[]) =>
    ({ data: { transactions } }) as unknown as EnterYieldResponseSuccess;

describe('verifyEnterTransactions', () => {
    it('returns success when all transactions are verified', () => {
        const response = mockResponse([
            { type: TransactionDtoType.APPROVAL, unsignedTransaction: APPROVAL_UNSIGNED_TX },
            { type: TransactionDtoType.SUPPLY, unsignedTransaction: SUPPLY_UNSIGNED_TX },
        ]);

        expect(
            verifyEnterTransactions(response, {
                yieldId: YIELD_ID,
                address: ADDRESS,
                amount: AMOUNT,
                decimals: DECIMALS,
            }),
        ).toBe('success');
    });

    it('returns failure when supply to address does not match vault', () => {
        const tx = JSON.parse(SUPPLY_UNSIGNED_TX);
        tx.to = '0x0000000000000000000000000000000000000001';
        const response = mockResponse([
            { type: TransactionDtoType.SUPPLY, unsignedTransaction: JSON.stringify(tx) },
        ]);

        expect(
            verifyEnterTransactions(response, {
                yieldId: YIELD_ID,
                address: ADDRESS,
                amount: AMOUNT,
                decimals: DECIMALS,
            }),
        ).toBe('failure');
    });

    it('returns skipped when transaction type is unknown', () => {
        const response = mockResponse([
            { type: TransactionDtoType.STAKE, unsignedTransaction: APPROVAL_UNSIGNED_TX },
        ]);

        expect(
            verifyEnterTransactions(response, {
                yieldId: YIELD_ID,
                address: ADDRESS,
                amount: AMOUNT,
                decimals: DECIMALS,
            }),
        ).toBe('skipped');
    });

    it('returns failure when vault is not in constants', () => {
        const response = mockResponse([
            { type: TransactionDtoType.APPROVAL, unsignedTransaction: APPROVAL_UNSIGNED_TX },
            { type: TransactionDtoType.SUPPLY, unsignedTransaction: SUPPLY_UNSIGNED_TX },
        ]);

        expect(
            verifyEnterTransactions(response, {
                yieldId: 'unknown-yield-id',
                address: ADDRESS,
                amount: AMOUNT,
                decimals: DECIMALS,
            }),
        ).toBe('failure');
    });

    it('returns failure when amount does not match', () => {
        const response = mockResponse([
            { type: TransactionDtoType.APPROVAL, unsignedTransaction: APPROVAL_UNSIGNED_TX },
            { type: TransactionDtoType.SUPPLY, unsignedTransaction: SUPPLY_UNSIGNED_TX },
        ]);

        expect(
            verifyEnterTransactions(response, {
                yieldId: YIELD_ID,
                address: ADDRESS,
                amount: '999',
                decimals: DECIMALS,
            }),
        ).toBe('failure');
    });
});
