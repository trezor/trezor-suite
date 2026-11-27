import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { isAccountWatchOnly, prepareWatchOnlyAccountPayload } from '@suite-common/wallet-utils';
import { type AccountInfo } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';

import { accountsActions } from './accountsActions';

const ethSymbol = asNetworkSymbol('eth');

describe('createAccount', () => {
    afterEach(() => jest.restoreAllMocks());

    it('creates a watch-only account from a watched address', async () => {
        const payload: AccountInfo = {
            descriptor: '0xAbCd',
            balance: '5',
            availableBalance: '5',
            empty: false,
            history: { total: 1, unconfirmed: 0 },
        };
        // spyOn types the mock by the last (bundled) overload.
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockImplementation((() =>
            Promise.resolve({
                success: true,
                payload,
            })) as unknown as typeof TrezorConnect.getAccountInfo);

        const newAccount = await prepareWatchOnlyAccountPayload({
            address: '0xAbCd',
            networkSymbol: ethSymbol,
            index: 1,
            device: mockSuiteDevice({ state: { staticSessionId: '1stTestnet@device_id:0' } }),
        });
        if (newAccount instanceof Error) throw newAccount;

        const { account } = accountsActions.createAccount(newAccount, [ethSymbol]).payload;

        expect(isAccountWatchOnly(account)).toBe(true);
        expect(account.descriptor).toBe('0xAbCd');
    });
});
