import type { resilientStakingBatchResponse as importedSchema } from './resilientStakingBatchResponse';
import { type StakingBatchDataItem, type StakingBatchErrorsItem } from '../../api/types';

const mockCaptureException = jest.fn();

jest.mock('@sentry/core', () => ({
    captureException: mockCaptureException,
    withScope: (callback: (scope: { setTag: jest.Mock }) => void) =>
        callback({ setTag: jest.fn() }),
}));

type SchemaModule = { resilientStakingBatchResponse: typeof importedSchema };

let resilientStakingBatchResponse: typeof importedSchema;

const ethSection = {
    symbol: 'eth',
    stats: { apy: 3.08, nextRewardPayout: 3600 },
    validators: { activationTime: 600, exitTime: 1200 },
} satisfies StakingBatchDataItem;

const solSection = {
    symbol: 'sol',
    stats: { apy: 7.5 },
} satisfies StakingBatchDataItem;

const adaSection = {
    symbol: 'ada',
    pools: [{ apy: 2.4, saturation: 80.77, id: 'pool1' }],
} satisfies StakingBatchDataItem;

const trxSection = {
    symbol: 'trx',
    representatives: [
        { address: 'TR7Nb', name: 'LugaNodes', url: 'https://luganodes.com', apr: 4.2 },
    ],
} satisfies StakingBatchDataItem;

const upstreamError = {
    code: 'upstream_unknown_error',
    message: 'Failed to fetch from upstream',
} satisfies StakingBatchErrorsItem;

// The apr an upstream drift could plausibly start sending as a string, which is what makes the
// whole `trx` entry unparseable.
const driftedTrxSection = {
    ...trxSection,
    representatives: [{ ...trxSection.representatives[0], apr: '4.2' }],
};

const driftedAdaSection = {
    ...adaSection,
    pools: [{ ...adaSection.pools[0], saturation: '80.77' }],
};

describe('resilientStakingBatchResponse', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        ({ resilientStakingBatchResponse } =
            require('./resilientStakingBatchResponse') as SchemaModule);
    });

    it('passes through a batch in which every network matched the expected shape', () => {
        const batch = {
            data: [ethSection, solSection, adaSection, trxSection],
            errors: [upstreamError],
        };

        expect(resilientStakingBatchResponse.parse(batch)).toEqual(batch);
        expect(mockCaptureException).not.toHaveBeenCalled();
    });

    it('keeps the networks that parsed when another network no longer matches its shape', () => {
        const result = resilientStakingBatchResponse.parse({
            data: [ethSection, solSection, adaSection, driftedTrxSection],
            errors: [upstreamError],
        });

        expect(result.data).toEqual([ethSection, solSection, adaSection]);
        expect(result.errors).toEqual([
            upstreamError,
            {
                code: 'upstream_validation_error',
                message: 'Suite schema mismatch, dropped trx',
            },
        ]);
    });

    it('names a dropped entry by its symbol, or by its position when it carries none', () => {
        const { data, errors } = resilientStakingBatchResponse.parse({
            data: [{ symbol: 'btc', stats: { apy: 1 } }, { stats: { apy: 7.5 } }, 'nonsense'],
            errors: [],
        });

        expect(data).toEqual([]);
        expect(errors.map(({ message }) => message)).toEqual([
            'Suite schema mismatch, dropped btc',
            'Suite schema mismatch, dropped data[1]',
            'Suite schema mismatch, dropped data[2]',
        ]);
    });

    it('keeps an error entry whose code the app does not know yet, instead of rejecting the batch', () => {
        const result = resilientStakingBatchResponse.parse({
            data: [ethSection, solSection, adaSection, trxSection],
            errors: [{ code: 'upstream_timeout', message: 'Upstream timed out' }],
        });

        expect(result.data).toEqual([ethSection, solSection, adaSection, trxSection]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.code).toBe('upstream_unknown_error');
        expect(result.errors[0]?.message).toContain('upstream_timeout');
        expect(result.errors[0]?.message).toContain('Upstream timed out');
    });

    it('rejects a response whose top-level shape is unusable, so the caller still sees a failure', () => {
        expect(resilientStakingBatchResponse.safeParse({ data: null, errors: [] }).success).toBe(
            false,
        );
        expect(resilientStakingBatchResponse.safeParse({ data: [ethSection] }).success).toBe(false);
        expect(resilientStakingBatchResponse.safeParse('not an object').success).toBe(false);
    });

    it('reports a drift to Sentry once per signature, since the caller only logs it at warn level', () => {
        const drifted = { data: [ethSection, driftedTrxSection], errors: [] };

        resilientStakingBatchResponse.parse(drifted);
        resilientStakingBatchResponse.parse(drifted);

        expect(mockCaptureException).toHaveBeenCalledTimes(1);
        expect(mockCaptureException.mock.calls[0]?.[0]).toEqual(
            new Error('Staking batch entries no longer match the generated schemas: trx'),
        );

        resilientStakingBatchResponse.parse({
            data: [ethSection, driftedTrxSection, driftedAdaSection],
            errors: [],
        });

        expect(mockCaptureException).toHaveBeenCalledTimes(2);
        expect(mockCaptureException.mock.calls[1]?.[0].message).toContain('trx, ada');
    });
});
