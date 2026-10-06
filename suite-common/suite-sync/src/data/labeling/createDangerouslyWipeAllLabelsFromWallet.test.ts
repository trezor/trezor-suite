import { createMockDeps, mock } from '@suite-common/dependency-injection';
import {
    type SuiteSyncUpdateError,
    createSuiteSyncAddressId,
    createSuiteSyncOutputId,
} from '@suite-common/suite-sync-storage';
import {
    type UpdateAccountLabelDep,
    type UpdateAddressLabelDep,
    type UpdateOutputLabelDep,
    type UpdateWalletLabelDep,
} from '@suite-common/suite-sync-types';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId, asWalletDescriptor } from '@trezor/device-utils';
import { err, ok } from '@trezor/type-utils';

import {
    type DangerouslyWipeAllLabelsFromWalletDeps,
    createDangerouslyWipeAllLabelsFromWallet,
} from './createDangerouslyWipeAllLabelsFromWallet';

const btcSymbol = asNetworkSymbol('btc');

const walletDescriptor = asWalletDescriptor('wallet1');
const deviceStaticSessionId: StaticSessionId = 'wallet1@device:0';

const account = mockWalletAccount({
    symbol: btcSymbol,
    deviceState: deviceStaticSessionId,
    descriptor: asAccountDescriptor('account1'),
});

const createDeps = ({
    updateWalletLabel,
    updateAccountLabel,
    updateAddressLabel,
    updateOutputLabel,
}: UpdateWalletLabelDep &
    UpdateAccountLabelDep &
    UpdateAddressLabelDep &
    UpdateOutputLabelDep): DangerouslyWipeAllLabelsFromWalletDeps => {
    const otherWalletAccount = mockWalletAccount({
        symbol: btcSymbol,
        deviceState: 'wallet2@device:0',
        descriptor: asAccountDescriptor('account2'),
    });

    return createMockDeps<DangerouslyWipeAllLabelsFromWalletDeps>({
        getWalletLabel: currentWalletDescriptor =>
            currentWalletDescriptor === walletDescriptor ? 'Wallet label' : null,
        getAccounts: () => [account, otherWalletAccount],
        getAllLabelsForAccount: ({ accountDescriptor }) => ({
            accountLabel: accountDescriptor === account.descriptor ? 'Account label' : null,
            addressLabels:
                accountDescriptor === account.descriptor
                    ? [
                          {
                              id: createSuiteSyncAddressId('bc1address', btcSymbol),
                              address: 'bc1address',
                              label: 'Address label',
                              accountDescriptor: account.descriptor,
                              networkSymbol: btcSymbol,
                          },
                          {
                              id: createSuiteSyncAddressId('bc1empty', btcSymbol),
                              address: 'bc1empty',
                              label: null,
                              accountDescriptor: account.descriptor,
                              networkSymbol: btcSymbol,
                          },
                      ]
                    : [],
            outputLabels:
                accountDescriptor === account.descriptor
                    ? [
                          {
                              id: createSuiteSyncOutputId('tx-id', '0'),
                              txId: 'tx-id',
                              txTargetId: '0',
                              label: 'Output label',
                              accountDescriptor: account.descriptor,
                              networkSymbol: btcSymbol,
                          },
                          {
                              id: createSuiteSyncOutputId('tx-id-2', '1'),
                              txId: 'tx-id-2',
                              txTargetId: '1',
                              label: null,
                              accountDescriptor: account.descriptor,
                              networkSymbol: btcSymbol,
                          },
                      ]
                    : [],
        }),
        updateWalletLabel,
        updateAccountLabel,
        updateAddressLabel,
        updateOutputLabel,
    });
};

describe(createDangerouslyWipeAllLabelsFromWallet.name, () => {
    it('wipes wallet, account, address, and output labels for one wallet only', async () => {
        const updateWalletLabel = mock(() => Promise.resolve(ok(undefined)));
        const updateAccountLabel = mock(() => Promise.resolve(ok(undefined)));
        const updateAddressLabel = mock(() => Promise.resolve(ok(undefined)));
        const updateOutputLabel = mock(() => Promise.resolve(ok(undefined)));

        const deps = createDeps({
            updateWalletLabel,
            updateAccountLabel,
            updateAddressLabel,
            updateOutputLabel,
        });
        const dangerouslyWipeAllLabelsFromWallet = createDangerouslyWipeAllLabelsFromWallet(deps);

        const result = await dangerouslyWipeAllLabelsFromWallet({ walletDescriptor });

        expect(result).toEqual(ok(undefined));
        expect(updateWalletLabel).toHaveBeenCalledWith({
            deviceStaticSessionId,
            label: null,
        });
        expect(updateAccountLabel).toHaveBeenCalledWith({
            deviceStaticSessionId,
            accountKey: account.key,
            label: null,
        });
        expect(updateAddressLabel).toHaveBeenCalledWith({
            deviceStaticSessionId,
            address: 'bc1address',
            label: null,
            accountDescriptor: account.descriptor,
            networkSymbol: btcSymbol,
        });
        expect(updateOutputLabel).toHaveBeenCalledWith({
            deviceStaticSessionId,
            txId: 'tx-id',
            txTargetId: '0',
            label: null,
            accountDescriptor: account.descriptor,
            networkSymbol: btcSymbol,
        });
        expect(updateAccountLabel).toHaveBeenCalledTimes(1);
        expect(updateAddressLabel).toHaveBeenCalledTimes(1);
        expect(updateOutputLabel).toHaveBeenCalledTimes(1);
    });

    it('stops on first update error and propagates it', async () => {
        const updateError: SuiteSyncUpdateError = {
            type: 'SuiteSyncUpdateError',
            caused: new Error('update failed'),
        };
        const updateWalletLabel = mock(() => Promise.resolve(ok(undefined)));
        const updateAccountLabel = mock(() => Promise.resolve(err(updateError)));
        const updateAddressLabel = mock(() => Promise.resolve(ok(undefined)));
        const updateOutputLabel = mock(() => Promise.resolve(ok(undefined)));

        const deps = createDeps({
            updateWalletLabel,
            updateAccountLabel,
            updateAddressLabel,
            updateOutputLabel,
        });

        const dangerouslyWipeAllLabelsFromWallet = createDangerouslyWipeAllLabelsFromWallet(deps);

        const result = await dangerouslyWipeAllLabelsFromWallet({ walletDescriptor });

        expect(result).toEqual(err(updateError));
        expect(updateAccountLabel).toHaveBeenCalledTimes(1);
        expect(updateAddressLabel).not.toHaveBeenCalled();
        expect(updateOutputLabel).not.toHaveBeenCalled();
    });
});
