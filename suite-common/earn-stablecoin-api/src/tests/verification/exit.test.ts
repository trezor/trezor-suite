import { type ExitYieldResponseSuccess, TransactionDtoType } from '../../api';
import { verifyExitTransactions } from '../../verification/exit';

const YIELD_ID =
    'ethereum-usdt-steakusdt-0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829-third-party-oav';
const ADDRESS = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';

const WITHDRAW_UNSIGNED_TX =
    '{"from":"0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3","gasLimit":"0x071918","to":"0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829","data":"0xba0876520000000000000000000000000000000000000000000000000c7a27dbf69bc4850000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae30000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3","nonce":667,"type":2,"maxFeePerGas":"0x17d78400","maxPriorityFeePerGas":"0x054e0840","chainId":1}';

const mockResponse = (transactions: { type: TransactionDtoType; unsignedTransaction: unknown }[]) =>
    ({ data: { transactions } }) as unknown as ExitYieldResponseSuccess;

describe('verifyExitTransactions', () => {
    it('returns success when all transactions are verified', () => {
        const response = mockResponse([
            { type: TransactionDtoType.WITHDRAW, unsignedTransaction: WITHDRAW_UNSIGNED_TX },
        ]);

        expect(verifyExitTransactions(response, { yieldId: YIELD_ID, address: ADDRESS })).toBe(
            'success',
        );
    });

    it('returns failure when to address does not match vault', () => {
        const tx = JSON.parse(WITHDRAW_UNSIGNED_TX);
        tx.to = '0x0000000000000000000000000000000000000001';
        const response = mockResponse([
            { type: TransactionDtoType.WITHDRAW, unsignedTransaction: JSON.stringify(tx) },
        ]);

        expect(verifyExitTransactions(response, { yieldId: YIELD_ID, address: ADDRESS })).toBe(
            'failure',
        );
    });

    it('returns failure when receiver does not match address', () => {
        const tx = JSON.parse(WITHDRAW_UNSIGNED_TX);
        tx.data = tx.data.replace(
            /9ea3721b5bf3b64b4418c38b603154d2d597fae3/g,
            '0000000000000000000000000000000000000001',
        );
        const response = mockResponse([
            { type: TransactionDtoType.WITHDRAW, unsignedTransaction: JSON.stringify(tx) },
        ]);

        expect(verifyExitTransactions(response, { yieldId: YIELD_ID, address: ADDRESS })).toBe(
            'failure',
        );
    });

    it('returns skipped when transaction type is unknown', () => {
        const response = mockResponse([
            { type: TransactionDtoType.STAKE, unsignedTransaction: WITHDRAW_UNSIGNED_TX },
        ]);

        expect(verifyExitTransactions(response, { yieldId: YIELD_ID, address: ADDRESS })).toBe(
            'skipped',
        );
    });

    it('returns failure when vault is not in constants', () => {
        const response = mockResponse([
            { type: TransactionDtoType.WITHDRAW, unsignedTransaction: WITHDRAW_UNSIGNED_TX },
        ]);

        expect(
            verifyExitTransactions(response, { yieldId: 'unknown-yield-id', address: ADDRESS }),
        ).toBe('failure');
    });
});
