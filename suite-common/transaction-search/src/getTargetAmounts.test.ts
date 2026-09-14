import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { testMocks } from '@suite-common/test-utils';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { getTargetAmounts } from './getTargetAmounts';

const networkConfigDeps = mockNetworkConfigDeps();

const { getWalletTransaction } = testMocks;

describe(getTargetAmounts.name, () => {
    it('returns amounts of transaction targets', () => {
        const transaction = getWalletTransaction({ type: 'recv' });

        expect(getTargetAmounts(networkConfigDeps, transaction)).toEqual(['0.00001']);
    });

    it('falls back to the transaction amount when targets are empty', () => {
        const transaction = getWalletTransaction({ targets: [] });

        expect(getTargetAmounts(networkConfigDeps, transaction)).toEqual(['0.00001']);
    });

    it('falls back to the transaction amount when targets are missing', () => {
        const transaction = {
            ...getWalletTransaction(),
            targets: undefined,
        } as unknown as WalletAccountTransaction;

        expect(getTargetAmounts(networkConfigDeps, transaction)).toEqual(['0.00001']);
    });
});
