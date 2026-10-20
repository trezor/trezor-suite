import { buildStakeData, buildUnstakeData } from './everstakeCalldata';
import {
    validateEverstakeClaimLiveState,
    validateEverstakeStepLiveState,
    validateEverstakeUnstakeLiveState,
} from './everstakeLiveState';
import { type EthereumStakingPoolRead } from '../../ethereumStakingLiveState';

const readPool = (read: EthereumStakingPoolRead) => jest.fn(() => Promise.resolve(read));

describe(validateEverstakeUnstakeLiveState.name, () => {
    it('is valid when the autocompound balance covers the requested amount', () => {
        expect(
            validateEverstakeUnstakeLiveState(
                { autocompoundBalance: '2000000000000000000' },
                '1.5',
            ),
        ).toEqual({ isValid: true });
    });

    it('is invalid when the autocompound balance is missing', () => {
        expect(validateEverstakeUnstakeLiveState({}, '1.5')).toEqual({
            isValid: false,
            reason: { code: 'AUTOCOMPOUND_BALANCE_MISSING' },
        });
        expect(validateEverstakeUnstakeLiveState(undefined, '1.5')).toEqual({
            isValid: false,
            reason: { code: 'AUTOCOMPOUND_BALANCE_MISSING' },
        });
    });

    it('is invalid when the requested amount exceeds the live balance', () => {
        expect(
            validateEverstakeUnstakeLiveState({ autocompoundBalance: '100000000000000' }, '0.1'),
        ).toEqual({
            isValid: false,
            reason: { code: 'MAX_AMOUNT_FOR_UNSTAKE', maxAmount: '0.0001' },
        });
    });
});

describe(validateEverstakeClaimLiveState.name, () => {
    it('is valid when the withdraw request is fully filled', () => {
        expect(
            validateEverstakeClaimLiveState({
                withdrawTotalAmount: '100000000000000000',
                claimableAmount: '100000000000000000',
            }),
        ).toEqual({ isValid: true });
    });

    it('is invalid when the withdraw or claimable amount is missing', () => {
        expect(
            validateEverstakeClaimLiveState({ withdrawTotalAmount: '100000000000000000' }),
        ).toEqual({
            isValid: false,
            reason: { code: 'CLAIM_AMOUNTS_MISSING' },
        });
    });

    it('is invalid when nothing has been requested for unstake', () => {
        expect(
            validateEverstakeClaimLiveState({ withdrawTotalAmount: '0', claimableAmount: '0' }),
        ).toEqual({ isValid: false, reason: { code: 'NO_AMOUNT_REQUESTED_FOR_UNSTAKE' } });
    });

    it('is invalid when the withdraw request is not fully filled yet', () => {
        expect(
            validateEverstakeClaimLiveState({
                withdrawTotalAmount: '200000000000000000',
                claimableAmount: '100000000000000000',
            }),
        ).toEqual({ isValid: false, reason: { code: 'UNSTAKE_REQUEST_NOT_FILLED' } });
    });
});

describe(validateEverstakeStepLiveState.name, () => {
    it('is valid for stake without reading the pool', async () => {
        const read = readPool({ success: true, stakingPool: undefined });

        await expect(
            validateEverstakeStepLiveState({ label: 'stake', data: buildStakeData() }, read),
        ).resolves.toEqual({ isValid: true });
        expect(read).not.toHaveBeenCalled();
    });

    it('validates an unstake against the amount carried by the calldata', async () => {
        const read = readPool({
            success: true,
            stakingPool: { autocompoundBalance: '2000000000000000000' },
        });

        await expect(
            validateEverstakeStepLiveState(
                { label: 'unstake', data: buildUnstakeData('1500000000000000000', 5) },
                read,
            ),
        ).resolves.toEqual({ isValid: true });
        expect(read).toHaveBeenCalledTimes(1);
    });

    it('is invalid for an unstake whose calldata carries no amount', async () => {
        const read = readPool({
            success: true,
            stakingPool: { autocompoundBalance: '2000000000000000000' },
        });

        await expect(
            validateEverstakeStepLiveState({ label: 'unstake', data: buildStakeData() }, read),
        ).resolves.toEqual({ isValid: false, reason: { code: 'MISSING_UNSTAKE_AMOUNT' } });
    });

    it('validates a claim against the withdraw request', async () => {
        const read = readPool({
            success: true,
            stakingPool: {
                withdrawTotalAmount: '100000000000000000',
                claimableAmount: '100000000000000000',
            },
        });

        await expect(
            validateEverstakeStepLiveState({ label: 'claim', data: '0x33986ffa' }, read),
        ).resolves.toEqual({ isValid: true });
    });

    it('is invalid when the pool cannot be read', async () => {
        const read = readPool({ success: false, message: 'Account info error' });

        await expect(
            validateEverstakeStepLiveState({ label: 'claim', data: '0x33986ffa' }, read),
        ).resolves.toEqual({
            isValid: false,
            reason: { code: 'ACCOUNT_INFO_FAILED', message: 'Account info error' },
        });
    });
});
