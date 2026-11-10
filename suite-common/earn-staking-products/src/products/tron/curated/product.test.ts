import type { TrxStats } from '@suite-common/earn-staking-api';
import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
} from '@suite-common/earn-staking-common';
import {
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_STAKING_NOW_SECONDS,
    MOCK_TRON_LUGANODES_SR,
    mockTronStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './messageSystemFeatures';
import { type TronCuratedProductDeps, createTronCuratedProduct } from './product';
import { everstakeProvider } from '../../../providers/everstake';
import { luganodesProvider } from '../../../providers/luganodes';
import { p2pProvider } from '../../../providers/p2p';

const trxStats: TrxStats = [
    {
        address: MOCK_TRON_LUGANODES_SR,
        name: 'Luganodes',
        url: 'https://luganodes.com',
        apr: 3.252901,
    },
];

const createDeps = () =>
    createMockDeps<TronCuratedProductDeps>({
        getTronStakingStats: () => Promise.resolve(trxStats),
    });

const createCuratedProduct = (deps = createDeps()) =>
    createTronCuratedProduct({
        networkSymbol: asNetworkSymbol('trx'),
        providers: [luganodesProvider, p2pProvider],
        messageSystemFeatures: TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES,
        ...deps,
    });

describe('createTronCuratedProduct', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(MOCK_STAKING_NOW_SECONDS * 1000);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('builds the curated product', () => {
        expect(createCuratedProduct().descriptor.id).toBe('trx:trx:curated:native');
    });

    it('refuses providers without a Tron representative', () => {
        expect(() =>
            createTronCuratedProduct({
                networkSymbol: asNetworkSymbol('trx'),
                providers: [everstakeProvider],
                messageSystemFeatures: {},
                ...createDeps(),
            }),
        ).toThrow('no trx representative to vote for');
    });

    it('fetches the product info through the injected client', async () => {
        const deps = createDeps();

        await expect(createCuratedProduct(deps).fetchProductInfo({})).resolves.toMatchObject({
            rate: 3.252901,
            exitPeriodDays: 14,
            targets: [{ address: MOCK_TRON_LUGANODES_SR, providerId: 'luganodes' }],
        });
        expect(deps.getTronStakingStats).toHaveBeenCalledTimes(1);
    });

    it('derives the position of a Tron account', () => {
        expect(
            createCuratedProduct().getPosition({
                account: mockTronStakingAccount('votedSplit'),
                productInfo: null,
                transactions: [],
            }),
        ).toMatchObject({
            productId: 'trx:trx:curated:native',
            status: 'active',
            balances: { staked: '1000000000' },
        });
    });

    it('bounds a stake by the product limits', () => {
        expect(
            createCuratedProduct().getAmountBounds({
                account: mockStakingAccount({
                    symbol: asNetworkSymbol('trx'),
                    balance: '100000000',
                    availableBalance: '100000000',
                }),
                position: null,
                operation: 'stake',
                options: {},
            }),
        ).toEqual({ min: '1000000', max: '99500000' });
    });

    it('has no operations yet', async () => {
        await expect(
            createCuratedProduct().composeStep({
                account: mockStakingAccount({ symbol: asNetworkSymbol('trx') }),
                plan: mockStakingPlan(),
                step: mockStakingStep(),
                customFee: null,
            }),
        ).rejects.toEqual(new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notImplemented));
    });
});
