import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { testMocks } from '@suite-common/test-utils';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    type ApprovalFlowStepType,
    findPendingApprovalTxid,
    getApprovalFlowStepStatuses,
    getApprovalFlowSteps,
} from './approvalFlowUtils';

const USDT_CRYPTO_ID = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;
const DAI_CRYPTO_ID = 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId;

const QUOTE: ExchangeTrade = {
    orderId: 'order-1',
    isDex: true,
    send: DAI_CRYPTO_ID,
    status: 'APPROVAL_REQ',
};

const USDT_STEPS: ApprovalFlowStepType[] = ['revoke', 'approve', 'swap'];
const APPROVE_STEPS: ApprovalFlowStepType[] = ['approve', 'swap'];

describe('getApprovalFlowSteps', () => {
    it.each([undefined, '0'])('approves when preapproved amount is %s', preapprovedStringAmount => {
        expect(getApprovalFlowSteps({ ...QUOTE, preapprovedStringAmount })).toEqual(APPROVE_STEPS);
    });

    it('increases the limit when the token supports it', () => {
        expect(getApprovalFlowSteps({ ...QUOTE, preapprovedStringAmount: '10' })).toEqual([
            'increase',
            'swap',
        ]);
    });

    it('revokes before approving when the token cannot increase the limit', () => {
        expect(
            getApprovalFlowSteps({ ...QUOTE, send: USDT_CRYPTO_ID, preapprovedStringAmount: '10' }),
        ).toEqual(USDT_STEPS);
    });

    it('approves USDT without a revoke when nothing is preapproved', () => {
        expect(
            getApprovalFlowSteps({ ...QUOTE, send: USDT_CRYPTO_ID, preapprovedStringAmount: '0' }),
        ).toEqual(APPROVE_STEPS);
    });
});

describe('getApprovalFlowStepStatuses', () => {
    const getStatuses = (steps: ApprovalFlowStepType[], quote: Partial<ExchangeTrade>) =>
        getApprovalFlowStepStatuses(steps, { ...QUOTE, ...quote }).map(({ status }) => status);

    it('returns no statuses without a quote', () => {
        expect(getApprovalFlowStepStatuses(USDT_STEPS, undefined)).toEqual([]);
    });

    it.each<[string, Partial<ExchangeTrade>, string[]]>([
        ['revoke required', { preapprovedStringAmount: '10' }, ['active', 'upcoming', 'upcoming']],
        [
            'revoke prepared on the form but not sent',
            { preapprovedStringAmount: '10', approvalType: 'ZERO' },
            ['active', 'upcoming', 'upcoming'],
        ],
        [
            'revoke pending',
            {
                preapprovedStringAmount: '10',
                status: 'APPROVAL_PENDING',
                approvalType: 'ZERO',
                approvalSendTxHash: '0xrevoke',
            },
            ['pending', 'upcoming', 'upcoming'],
        ],
        [
            'revoke confirmed, quote not refreshed yet',
            {
                preapprovedStringAmount: '10',
                approvalType: 'ZERO',
                approvalSendTxHash: '0xrevoke',
            },
            ['done', 'active', 'upcoming'],
        ],
        [
            'revoke confirmed, quote refreshed',
            { preapprovedStringAmount: '0', approvalType: 'MINIMAL' },
            ['done', 'active', 'upcoming'],
        ],
        [
            'approve pending',
            {
                preapprovedStringAmount: '0',
                status: 'APPROVAL_PENDING',
                approvalType: 'MINIMAL',
                approvalSendTxHash: '0xapprove',
            },
            ['done', 'pending', 'upcoming'],
        ],
        [
            'approve confirmed',
            { preapprovedStringAmount: '0', status: 'CONFIRM' },
            ['done', 'done', 'upcoming'],
        ],
    ])('USDT flow: %s', (_, quote, expected) => {
        expect(getStatuses(USDT_STEPS, quote)).toEqual(expected);
    });

    it.each<[string, Partial<ExchangeTrade>, string[]]>([
        ['approve required', {}, ['active', 'upcoming']],
        [
            'approve pending',
            { status: 'APPROVAL_PENDING', approvalSendTxHash: '0xapprove' },
            ['pending', 'upcoming'],
        ],
        ['approve confirmed', { status: 'CONFIRM' }, ['done', 'upcoming']],
        ['approve confirmed with sign data', { status: 'SIGN_DATA' }, ['done', 'upcoming']],
    ])('approve flow: %s', (_, quote, expected) => {
        expect(getStatuses(APPROVE_STEPS, quote)).toEqual(expected);
    });

    it('keeps a confirmed revoke done when the refreshed quote still reports the old limit', () => {
        expect(
            getApprovalFlowStepStatuses(
                USDT_STEPS,
                { ...QUOTE, preapprovedStringAmount: '10', approvalType: 'MINIMAL' },
                ['revoke'],
            ).map(({ status }) => status),
        ).toEqual(['done', 'active', 'upcoming']);
    });

    it('marks an increase done once the quote is confirmable', () => {
        expect(getStatuses(['increase', 'swap'], { status: 'CONFIRM' })).toEqual([
            'done',
            'upcoming',
        ]);
    });

    it.each<[string, ApprovalFlowStepType[], Partial<ExchangeTrade>, string[]]>([
        ['approve', APPROVE_STEPS, {}, ['pending', 'upcoming']],
        [
            'revoke',
            USDT_STEPS,
            { preapprovedStringAmount: '10' },
            ['pending', 'upcoming', 'upcoming'],
        ],
        [
            'approve after a confirmed revoke',
            USDT_STEPS,
            { preapprovedStringAmount: '0' },
            ['done', 'pending', 'upcoming'],
        ],
        [
            'increase',
            ['increase', 'swap'],
            { preapprovedStringAmount: '10' },
            ['pending', 'upcoming'],
        ],
    ])(
        'marks the current %s step pending with a pending approval tx',
        (_, steps, quote, expected) => {
            expect(
                getApprovalFlowStepStatuses(steps, { ...QUOTE, ...quote }, [], true).map(
                    ({ status }) => status,
                ),
            ).toEqual(expected);
        },
    );

    it('keeps confirmed steps done with a pending approval tx', () => {
        expect(
            getApprovalFlowStepStatuses(
                APPROVE_STEPS,
                { ...QUOTE, status: 'CONFIRM' },
                [],
                true,
            ).map(({ status }) => status),
        ).toEqual(['done', 'upcoming']);
    });

    it('keeps step types in order', () => {
        expect(getApprovalFlowStepStatuses(USDT_STEPS, QUOTE).map(({ type }) => type)).toEqual(
            USDT_STEPS,
        );
    });
});

describe('findPendingApprovalTxid', () => {
    const DAI_CONTRACT = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const SPENDER = '0x1111111254eeb25477b68fb85ed929f73a960582';
    const OTHER_SPENDER = '0x9008d19f58aabd9ed0d60971565aa8510560ab41';

    const getApproveData = (spender: string) =>
        `0x095ea7b3${spender.slice(2).padStart(64, '0')}${'0'.padStart(64, '0')}`;

    const APPROVAL_QUOTE: ExchangeTrade = {
        ...QUOTE,
        dexTx: { from: '0xowner', to: DAI_CONTRACT, data: getApproveData(SPENDER), value: '0' },
    };

    type ApprovalTxParams = {
        txid?: string;
        contract?: string;
        data?: string;
        blockHeight?: number;
    };

    const getApprovalTx = ({
        txid = '0xpending',
        contract = DAI_CONTRACT,
        data = getApproveData(SPENDER),
        blockHeight = 0,
    }: ApprovalTxParams = {}): WalletAccountTransaction => {
        const tx = testMocks.getWalletTransaction({ txid, blockHeight });

        return {
            ...tx,
            ethereumSpecific: {
                status: -1,
                nonce: 1,
                gasLimit: 60000,
                gasUsed: 0,
                gasPrice: '1',
                data,
            },
            details: {
                ...tx.details,
                vout: [{ addresses: [contract], isAddress: true, n: 0, value: '0' }],
            },
        };
    };

    it('finds a pending approve to the quote token and spender', () => {
        expect(findPendingApprovalTxid([getApprovalTx()], APPROVAL_QUOTE)).toBe('0xpending');
    });

    it('compares addresses case-insensitively', () => {
        expect(
            findPendingApprovalTxid(
                [
                    getApprovalTx({
                        contract: DAI_CONTRACT.toUpperCase().replace('0X', '0x'),
                        data: getApproveData(SPENDER.toUpperCase().replace('0X', '0x')),
                    }),
                ],
                APPROVAL_QUOTE,
            ),
        ).toBe('0xpending');
    });

    it.each<[string, WalletAccountTransaction]>([
        [
            'another token',
            getApprovalTx({ contract: '0xdac17f958d2ee523a2206206994597c13d831ec7' }),
        ],
        ['another spender', getApprovalTx({ data: getApproveData(OTHER_SPENDER) })],
        ['a confirmed approve', getApprovalTx({ blockHeight: 100 })],
        ['a non-approve call', getApprovalTx({ data: '0xa9059cbb' })],
    ])('ignores %s', (_, tx) => {
        expect(findPendingApprovalTxid([tx], APPROVAL_QUOTE)).toBeUndefined();
    });

    it('ignores a quote without approve calldata', () => {
        expect(findPendingApprovalTxid([getApprovalTx()], QUOTE)).toBeUndefined();
    });

    it('ignores a quote without a token to send', () => {
        expect(
            findPendingApprovalTxid([getApprovalTx()], {
                ...APPROVAL_QUOTE,
                send: 'ethereum' as CryptoId,
            }),
        ).toBeUndefined();
    });

    it('returns undefined without a quote', () => {
        expect(findPendingApprovalTxid([getApprovalTx()], undefined)).toBeUndefined();
    });
});
