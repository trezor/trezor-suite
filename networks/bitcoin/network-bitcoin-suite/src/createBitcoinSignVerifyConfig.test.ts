import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type TrezorConnect from '@trezor/connect';

import { createBitcoinSignVerifyConfig } from './createBitcoinSignVerifyConfig';

const account = mockWalletAccount({ symbol: 'btc' });
const device = mockSuiteDevice();

describe(createBitcoinSignVerifyConfig.name, () => {
    it('delegates signing, verifying and address display to Bitcoin Connect methods', async () => {
        const signMessage = jest.fn().mockResolvedValue({
            success: true,
            payload: { address: 'address', signature: 'signature' },
        });
        const verifyMessage = jest.fn().mockResolvedValue({
            success: true,
            payload: { message: 'message' },
        });
        const getAddress = jest.fn().mockResolvedValue({
            success: true,
            payload: { address: 'address' },
        });
        const trezorConnect = {
            signMessage,
            verifyMessage,
            getAddress,
        } as unknown as Pick<typeof TrezorConnect, 'getAddress' | 'signMessage' | 'verifyMessage'>;
        const config = createBitcoinSignVerifyConfig(trezorConnect);
        const commonParams = { account, device, coin: account.symbol };

        await config.sign({
            ...commonParams,
            path: account.path,
            message: 'message',
            hex: false,
            signOption: true,
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

        expect(signMessage).toHaveBeenCalledWith(expect.objectContaining({ no_script_type: true }));
        expect(verifyMessage).toHaveBeenCalledWith(
            expect.objectContaining({ signature: 'signature' }),
        );
        expect(getAddress).toHaveBeenCalledWith(expect.objectContaining({ path: account.path }));
    });
});
