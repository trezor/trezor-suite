import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StakingPool } from '@trezor/blockchain-link-types';
import TrezorConnect, { type OkWithDevice } from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';
import { type Err } from '@trezor/type-utils';

import { WALLET_SDK_SOURCE, WALLET_SDK_SOURCE_MOBILE } from '../../../shared/stakingConstants';
import { type EthereumStakingPoolsRead } from '../../ethereumStakingLiveState';
import { type StakingPlanContext, type StakingUnstakePreviewParams } from '../types';
import { simulateUnstakeFixture } from './__fixtures__/everstake';
import {
    buildClaimWithdrawRequestData,
    buildStakeData,
    buildUnstakeData,
} from './everstakeCalldata';
import { STAKE_GAS_LIMIT_RESERVE, UNSTAKE_INTERCHANGES } from './everstakeConstants';
import { planEverstakeOperation, previewEverstakeUnstake } from './everstakePlan';

const FROM = asAccountDescriptor('0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC');

const everstakePool = (pool: Partial<StakingPool>): StakingPool =>
    ({ contract: EVERSTAKE_CONTRACTS[1].accounting, ...pool }) as StakingPool;

const withPool = (pool: Partial<StakingPool>): EthereumStakingPoolsRead => ({
    success: true,
    stakingPools: [everstakePool(pool)],
});

const createContext = (
    read: EthereumStakingPoolsRead = { success: true, stakingPools: [] },
    symbol: NetworkSymbol = asNetworkSymbol('eth'),
): StakingPlanContext & { readStakingPools: jest.Mock } => ({
    account: mockWalletAccount({ symbol, descriptor: FROM }),
    source: WALLET_SDK_SOURCE,
    readStakingPools: jest.fn(() => Promise.resolve(read)),
});

describe(planEverstakeOperation.name, () => {
    it('plans a stake into the pool without reading the chain', async () => {
        const context = createContext();

        const result = await planEverstakeOperation({ type: 'stake', amount: '0.1' }, context);

        expect(result).toEqual({
            success: true,
            plan: {
                providerId: 'everstake',
                operation: { type: 'stake', amount: '0.1' },
                steps: [
                    {
                        label: 'stake',
                        to: EVERSTAKE_CONTRACTS[1].pool,
                        data: buildStakeData(),
                        value: '100000000000000000',
                        gasReserve: STAKE_GAS_LIMIT_RESERVE,
                    },
                ],
            },
        });
        expect(context.readStakingPools).not.toHaveBeenCalled();
    });

    it('attributes the calldata to the planning app', async () => {
        const context = { ...createContext(), source: WALLET_SDK_SOURCE_MOBILE };

        const result = await planEverstakeOperation({ type: 'stake', amount: '0.1' }, context);

        expect(result.success && result.plan.steps[0]?.data).toBe(
            buildStakeData(WALLET_SDK_SOURCE_MOBILE),
        );
    });

    it('rejects a stake below the minimum amount', async () => {
        const result = await planEverstakeOperation(
            { type: 'stake', amount: '0.000000000000000001' },
            createContext(),
        );

        expect(result).toEqual({
            success: false,
            error: { code: 'AMOUNT_BELOW_MINIMUM', minAmount: '0.01' },
        });
    });

    it('plans an unstake once the live pool balance covers the amount', async () => {
        const context = createContext(withPool({ autocompoundBalance: '2000000000000000000' }));

        const result = await planEverstakeOperation({ type: 'unstake', amount: '0.1' }, context);

        expect(result.success && result.plan.steps).toEqual([
            {
                label: 'unstake',
                to: EVERSTAKE_CONTRACTS[1].pool,
                data: buildUnstakeData('100000000000000000', UNSTAKE_INTERCHANGES),
                value: '0',
                gasReserve: STAKE_GAS_LIMIT_RESERVE,
            },
        ]);
        expect(context.readStakingPools).toHaveBeenCalledTimes(1);
    });

    it('rejects an unstake above the live pool balance', async () => {
        const result = await planEverstakeOperation(
            { type: 'unstake', amount: '0.1' },
            createContext(withPool({ autocompoundBalance: '100000000000000' })),
        );

        expect(result).toEqual({
            success: false,
            error: {
                code: 'LIVE_STATE_INVALID',
                reason: { code: 'MAX_AMOUNT_FOR_UNSTAKE', maxAmount: '0.0001' },
            },
        });
    });

    it('rejects an unstake when the pool cannot be read', async () => {
        const result = await planEverstakeOperation(
            { type: 'unstake', amount: '0.1' },
            createContext({ success: false, message: 'Account info error' }),
        );

        expect(result).toEqual({
            success: false,
            error: {
                code: 'LIVE_STATE_INVALID',
                reason: { code: 'ACCOUNT_INFO_FAILED', message: 'Account info error' },
            },
        });
    });

    it('plans a claim against the accounting contract once the request is filled', async () => {
        const result = await planEverstakeOperation(
            { type: 'claim' },
            createContext(
                withPool({
                    withdrawTotalAmount: '100000000000000000',
                    claimableAmount: '100000000000000000',
                }),
            ),
        );

        expect(result.success && result.plan.steps).toEqual([
            {
                label: 'claim',
                to: EVERSTAKE_CONTRACTS[1].accounting,
                data: buildClaimWithdrawRequestData(),
                value: '0',
                gasReserve: STAKE_GAS_LIMIT_RESERVE,
            },
        ]);
    });

    it('rejects a claim before the withdraw request is filled', async () => {
        const result = await planEverstakeOperation(
            { type: 'claim' },
            createContext(
                withPool({ withdrawTotalAmount: '200000000000000000', claimableAmount: '1' }),
            ),
        );

        expect(result).toEqual({
            success: false,
            error: {
                code: 'LIVE_STATE_INVALID',
                reason: { code: 'UNSTAKE_REQUEST_NOT_FILLED' },
            },
        });
    });

    it('uses the Hoodi deployment for thod', async () => {
        const result = await planEverstakeOperation(
            { type: 'stake', amount: '0.1' },
            createContext(undefined, asNetworkSymbol('thod')),
        );

        expect(result.success && result.plan.steps[0]?.to).toBe(EVERSTAKE_CONTRACTS[560048].pool);
    });

    it('rejects a network without a deployment', async () => {
        const result = await planEverstakeOperation(
            { type: 'stake', amount: '0.1' },
            createContext(undefined, asNetworkSymbol('btc')),
        );

        expect(result).toEqual({ success: false, error: { code: 'UNSUPPORTED_NETWORK' } });
    });
});

type BlockchainEvmRpcCallResult = Err<SerializedError> | OkWithDevice<{ data: string }>;

describe(previewEverstakeUnstake.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    simulateUnstakeFixture.forEach(test => {
        it(test.description, async () => {
            jest.spyOn(TrezorConnect, 'blockchainEvmRpcCall').mockImplementation(() =>
                Promise.resolve(test.blockchainEvmRpcCallResult as BlockchainEvmRpcCallResult),
            );
            const result = await previewEverstakeUnstake({
                ...test.args,
                symbol: test.args.symbol ? asNetworkSymbol(test.args.symbol) : test.args.symbol,
            } as unknown as StakingUnstakePreviewParams);
            expect(result).toEqual(test.result);
        });
    });
});
