import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type TrezorConnect from '@trezor/connect';

import { createEthereumSignVerifyConfig } from './createEthereumSignVerifyConfig';

const account = mockWalletAccount({ symbol: 'eth' });
const device = mockSuiteDevice();

describe(createEthereumSignVerifyConfig.name, () => {
    it('uses the account path and delegates to Ethereum Connect methods', async () => {
        const ethereumSignMessage = jest.fn().mockResolvedValue({
            success: true,
            payload: { address: 'address', signature: 'signature' },
        });
        const ethereumVerifyMessage = jest.fn().mockResolvedValue({
            success: true,
            payload: { message: 'message' },
        });
        const ethereumGetAddress = jest.fn().mockResolvedValue({
            success: true,
            payload: { address: 'address' },
        });
        const trezorConnect = {
            ethereumSignMessage,
            ethereumVerifyMessage,
            ethereumGetAddress,
        } as unknown as Pick<
            typeof TrezorConnect,
            'ethereumGetAddress' | 'ethereumSignMessage' | 'ethereumVerifyMessage'
        >;
        const config = createEthereumSignVerifyConfig(trezorConnect);
        const commonParams = { account, device, coin: account.symbol };

        expect(config.getInitialValues?.(account, true)).toEqual({
            path: account.path,
            address: account.descriptor,
        });
        expect(config.isPathDisabled?.(account)).toBe(true);

        await config.sign({
            ...commonParams,
            path: account.path,
            message: 'message',
            hex: false,
            signOption: false,
        });
        await config.verify!({
            ...commonParams,
            address: 'address',
            message: 'message',
            signature: 'signature',
            hex: false,
        });
        await config.showAddress!({
            ...commonParams,
            address: 'address',
            path: account.path,
        });

        expect(ethereumSignMessage).toHaveBeenCalled();
        expect(ethereumVerifyMessage).toHaveBeenCalled();
        expect(ethereumGetAddress).toHaveBeenCalled();
    });
});
