import { type CryptoId, type ExchangeTrade } from 'invity-api';

import {
    type ApprovalFlowStepType,
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

    it('keeps step types in order', () => {
        expect(getApprovalFlowStepStatuses(USDT_STEPS, QUOTE).map(({ type }) => type)).toEqual(
            USDT_STEPS,
        );
    });
});

describe('getApprovalFlowSteps with the chain allowance', () => {
    it('approves when the chain reports no allowance despite the provider', () => {
        expect(getApprovalFlowSteps({ ...QUOTE, preapprovedStringAmount: '10' }, '0')).toEqual(
            APPROVE_STEPS,
        );
    });

    it('revokes first when the chain reports an allowance the provider does not know', () => {
        expect(
            getApprovalFlowSteps(
                { ...QUOTE, send: USDT_CRYPTO_ID, preapprovedStringAmount: '0' },
                '10',
            ),
        ).toEqual(USDT_STEPS);
    });
});

describe('getApprovalFlowStepStatuses with the chain allowance', () => {
    it('marks the revoke done once the chain reports no allowance', () => {
        expect(
            getApprovalFlowStepStatuses(
                USDT_STEPS,
                { ...QUOTE, preapprovedStringAmount: '10' },
                [],
                '0',
            ),
        ).toEqual([
            { type: 'revoke', status: 'done' },
            { type: 'approve', status: 'active' },
            { type: 'swap', status: 'upcoming' },
        ]);
    });

    it('keeps the revoke active while the chain still reports an allowance', () => {
        expect(
            getApprovalFlowStepStatuses(
                USDT_STEPS,
                { ...QUOTE, preapprovedStringAmount: '0' },
                [],
                '10',
            ),
        ).toEqual([
            { type: 'revoke', status: 'active' },
            { type: 'approve', status: 'upcoming' },
            { type: 'swap', status: 'upcoming' },
        ]);
    });
});
