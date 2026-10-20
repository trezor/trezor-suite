import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { type InternalTransfer } from '@trezor/connect';

import { getChangedInternalTxFixture, getInstantStakeTypeFixture } from './__fixtures__/everstake';
import { getChangedInternalTx, getInstantStakeType } from './everstakeTransactions';

describe(getInstantStakeType.name, () => {
    getInstantStakeTypeFixture.forEach(test => {
        it(test.description, () => {
            const result = getInstantStakeType(
                test.args.internalTransfer as InternalTransfer,
                test.args.address,
                test.args.symbol && asNetworkSymbol(test.args.symbol),
            );
            expect(result).toEqual(test.result);
        });
    });
});

describe(getChangedInternalTx.name, () => {
    getChangedInternalTxFixture.forEach(test => {
        it(test.description, () => {
            const result = getChangedInternalTx(
                test.args.prevTxs as WalletAccountTransaction[],
                test.args.currentTxs as WalletAccountTransaction[],
                test.args.selectedAccountAddress,
                test.args.symbol && asNetworkSymbol(test.args.symbol),
            );
            expect(result).toEqual(test.result);
        });
    });
});
