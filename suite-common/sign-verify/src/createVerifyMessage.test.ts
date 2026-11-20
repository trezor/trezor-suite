import { type NetworkSymbol } from '@suite-common/networks';
import { mockNetworkModule, mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import {
    type NetworkSignVerify,
    connectErrorToSignVerifyError,
} from '@trezor/network-module-suite-common-types';

import { type VerifyMessageDeps, createVerifyMessage } from './createVerifyMessage';

const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

const CONNECTED_DEVICE = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: '1@2:3' },
});

type VerifyMessage = NonNullable<NetworkSignVerify<NetworkSymbol>['verifyMessage']>;

describe('signVerify.verify', () => {
    let verifyMessage: jest.MockedFunction<VerifyMessage>;
    let reportVerify: jest.Mock;
    let deps: VerifyMessageDeps;

    beforeEach(() => {
        verifyMessage = mock<VerifyMessage>();
        reportVerify = jest.fn();
        deps = {
            networkModuleRepository: mockNetworkModuleRepository({
                get: () =>
                    mockNetworkModule({
                        signVerify: { signMessage: mock(), verifyMessage },
                    }),
                isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
            }),
            signVerifyReporter: { reportSign: jest.fn(), reportVerify },
        };
    });

    const setVerifyResponse = (response: any) => verifyMessage.mockResolvedValue(response);

    const verify = (
        account: Account,
        address: string,
        message: string,
        signature: string,
        hex = false,
    ) =>
        createVerifyMessage(deps).verify({
            device: CONNECTED_DEVICE,
            account,
            address,
            message,
            signature,
            hex,
        });

    it('verify', async () => {
        setVerifyResponse({
            success: true,
            payload: { message: MESSAGE },
        });
        const res = await verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE);
        expect(res.success).toBe(true);
    });

    describe('reporting', () => {
        it('reports a verify with the input format', async () => {
            setVerifyResponse({
                success: true,
                payload: { message: MESSAGE },
            });

            const result = await verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE, true);

            expect(reportVerify).toHaveBeenCalledTimes(1);
            expect(reportVerify).toHaveBeenCalledWith({ symbol: 'btc', hex: true }, result);
        });

        it.each(['Method_Cancel', 'Failure_ActionCancelled'])(
            'settles a verify rejected with %s as cancelled, not as a failure',
            async code => {
                setVerifyResponse({
                    success: false,
                    error: connectErrorToSignVerifyError({ message: 'Canceled', code }),
                });

                const result = await verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE);

                expect(result).toMatchObject({
                    success: false,
                    error: { type: 'DeviceCancelled' },
                });
            },
        );

        it('settles a signature that does not verify as failed', async () => {
            setVerifyResponse({
                success: false,
                error: connectErrorToSignVerifyError({
                    message: 'Invalid signature',
                    code: 'Failure_DataError',
                }),
            });

            const result = await verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE);

            expect(result).toMatchObject({
                success: false,
                error: { type: 'DeviceError' },
            });
        });

        it('never reports the message, the address or the signature', async () => {
            setVerifyResponse({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE);

            const reported = JSON.stringify(reportVerify.mock.calls.map(([params]) => params));

            expect(reported).not.toContain(MESSAGE);
            expect(reported).not.toContain(ADDRESS);
            expect(reported).not.toContain(SIGNATURE);
        });
    });
});
