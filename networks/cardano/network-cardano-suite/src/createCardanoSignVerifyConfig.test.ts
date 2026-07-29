import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { getStakingPath } from '@suite-common/wallet-utils';
import type TrezorConnect from '@trezor/connect';

import { createCardanoSignVerifyConfig } from './createCardanoSignVerifyConfig';

const account = mockWalletAccount(
    { symbol: 'ada' },
    {
        ...networkSpecificDefaultCardano,
        misc: {
            staking: {
                ...networkSpecificDefaultCardano.misc.staking,
                address: 'stake-address',
            },
        },
    },
);
const device = mockSuiteDevice();

describe(createCardanoSignVerifyConfig.name, () => {
    it('adds the staking address and normalizes the Cardano signing result', async () => {
        const cardanoSignMessage = jest.fn().mockResolvedValue({
            success: true,
            payload: {
                coseSignature: 'cose-signature',
                coseKey: 'cose-key',
                pubKey: 'public-key',
                headers: {
                    protected: {
                        address: 'signed-address',
                    },
                },
            },
        });
        const trezorConnect = {
            cardanoSignMessage,
        } as unknown as Pick<typeof TrezorConnect, 'cardanoSignMessage'>;
        const config = createCardanoSignVerifyConfig(trezorConnect);
        const stakingPath = getStakingPath(account);

        expect(config.getSignAddresses(account, [])[0]).toEqual({
            path: stakingPath,
            address: 'stake-address',
            category: 'TR_STAKING_STAKE_ADDRESS',
        });

        const result = await config.sign({
            account,
            device,
            coin: account.symbol,
            path: stakingPath,
            message: 'message',
            hex: false,
            signOption: true,
        });

        expect(cardanoSignMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: Buffer.from('message', 'utf8').toString('hex'),
            }),
        );
        expect(result).toEqual({
            success: true,
            payload: {
                signature: 'cose-signature',
                additionalResult: 'cose-key',
                address: 'signed-address',
            },
        });
    });
});
