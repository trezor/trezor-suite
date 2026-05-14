import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { err, ok } from '@trezor/type-utils';

import { createBip329ToSuiteSync } from '../suiteSync/createBip329ToSuiteSync';

const account = mockWalletAccount({
    symbol: 'btc',
    deviceState: '1@2:3',
});

const createDeps = () => ({
    updateOutputLabel: jest.fn().mockImplementation(() => Promise.resolve(ok())),
    updateAddressLabel: jest.fn().mockImplementation(() => Promise.resolve(ok())),
});

describe(createBip329ToSuiteSync.name, () => {
    it('syncs supported bip329 labels', async () => {
        const deps = createDeps();
        const importBip329ToSuiteSync = createBip329ToSuiteSync(deps);

        const result = await importBip329ToSuiteSync({
            account,
            bip329Labels: [
                {
                    type: 'output',
                    ref: 'txid:1',
                    label: 'Output label',
                },
                {
                    type: 'addr',
                    ref: 'bc1qaddress',
                    label: 'Address label',
                },
            ],
        });

        expect(deps.updateOutputLabel).toHaveBeenCalledWith({
            txId: 'txid',
            txTargetId: '1',
            label: 'Output label',
            networkSymbol: 'btc',
            deviceStaticSessionId: account.deviceState,
            accountDescriptor: account.descriptor,
        });
        expect(deps.updateAddressLabel).toHaveBeenCalledWith({
            address: 'bc1qaddress',
            label: 'Address label',
            networkSymbol: 'btc',
            deviceStaticSessionId: account.deviceState,
            accountDescriptor: account.descriptor,
        });
        expect(result).toEqual(ok());
    });

    it('ignores unsupported bip329 label types', async () => {
        const deps = createDeps();
        const importBip329ToSuiteSync = createBip329ToSuiteSync(deps);

        const result = await importBip329ToSuiteSync({
            account,
            bip329Labels: [
                { type: 'tx', ref: 'txid', label: 'Transaction label' },
                { type: 'wallet', ref: 'walletRef', label: 'Wallet label' },
                { type: 'xpub', ref: 'xpubRef', label: 'Xpub label' },
                { type: 'pubkey', ref: 'pubkeyRef', label: 'Pubkey label' },
                { type: 'input', ref: 'inputRef', label: 'Input label' },
            ],
        });

        expect(deps.updateOutputLabel).not.toHaveBeenCalled();
        expect(deps.updateAddressLabel).not.toHaveBeenCalled();
        expect(result).toEqual(ok());
    });

    it('returns the first label update error', async () => {
        const updateError = err({
            type: 'SuiteSyncUnavailableOnDeviceError',
        });
        const deps = createDeps();
        deps.updateOutputLabel.mockResolvedValue(updateError);

        const importBip329ToSuiteSync = createBip329ToSuiteSync(deps);
        const result = await importBip329ToSuiteSync({
            account,
            bip329Labels: [
                {
                    type: 'output',
                    ref: 'txid:1',
                    label: 'Output label',
                },
                {
                    type: 'addr',
                    ref: 'bc1qaddress',
                    label: 'Address label',
                },
            ],
        });

        expect(deps.updateOutputLabel).toHaveBeenCalledTimes(1);
        expect(deps.updateAddressLabel).not.toHaveBeenCalled();
        expect(result).toBe(updateError);
    });
});
