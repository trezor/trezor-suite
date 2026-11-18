// eslint-disable-next-line no-restricted-syntax -- Co-located regression coverage for the existing device helper.
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getPublicKeyForNetworkType } from '@suite-common/wallet-utils';

import { showXpubOnDevice } from './publicKeyActions';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getPublicKeyForNetworkType: jest.fn(),
}));

describe('showXpubOnDevice', () => {
    const device = mockSuiteDevice();
    const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

    it('requires on-device confirmation by default', () => {
        showXpubOnDevice(device, account);

        expect(getPublicKeyForNetworkType).toHaveBeenLastCalledWith(
            expect.objectContaining({ device, path: account.path, showOnTrezor: true }),
        );
    });

    it('can read the display value before requesting confirmation', () => {
        showXpubOnDevice(device, account, { showOnTrezor: false });

        expect(getPublicKeyForNetworkType).toHaveBeenLastCalledWith(
            expect.objectContaining({ device, path: account.path, showOnTrezor: false }),
        );
    });
});
