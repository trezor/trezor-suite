import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getStakingPath } from '@suite-common/wallet-utils';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { PROTO } from '@trezor/connect';

import { signCardanoMessageThunk } from './cardanoSignVerify';
import { type SignVerifyRootState } from '../signVerifyActions';

const ADDRESS_PATH = "m/1852'/1815'/0'/0/3";
const MESSAGE = 'MESSAGE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('ada'), index: 0 });

const getState = (): SignVerifyRootState => ({
    device: {
        ...deviceInitialState,
        selectedDevice: mockSuiteDevice({ connected: true, available: true }),
    },
});

const SIGNED_MESSAGE = {
    success: true,
    payload: {
        coseSignature: 'COSE_SIGNATURE',
        coseKey: 'COSE_KEY',
        pubKey: 'RAW_KEY',
        headers: { protected: { address: 'ADDRESS' } },
    },
};

describe(signCardanoMessageThunk.name, () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockAnalytics> } };

    const connect = () => testMocks.getTrezorConnectMock();

    const sign = ({ path = ADDRESS_PATH, hex = false, isCose = false } = {}) =>
        signCardanoMessageThunk({ account: ACCOUNT, path, message: MESSAGE, hex, isCose })(
            dispatch,
            getState,
            deps,
        );

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockAnalytics() } };
    });

    it.each([
        { isCose: false, pubKey: 'RAW_KEY' },
        { isCose: true, pubKey: 'COSE_KEY' },
    ])(
        'returns the COSE signature and the requested public key (COSE: $isCose)',
        async ({ isCose, pubKey }) => {
            testMocks.setTrezorConnectFixtures(SIGNED_MESSAGE);

            expect(await sign({ isCose })).toStrictEqual({
                signature: 'COSE_SIGNATURE',
                pubKey,
                address: 'ADDRESS',
            });
        },
    );

    it('hands a text message to the device hex-encoded', async () => {
        testMocks.setTrezorConnectFixtures(SIGNED_MESSAGE);

        await sign();

        expect(connect().cardanoSignMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({ payload: Buffer.from(MESSAGE, 'utf8').toString('hex') }),
        );
    });

    it('signs with the reward address for the staking path', async () => {
        testMocks.setTrezorConnectFixtures(SIGNED_MESSAGE);
        const stakingPath = getStakingPath(ACCOUNT);

        await sign({ path: stakingPath });

        expect(connect().cardanoSignMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                path: stakingPath,
                addressParameters: { addressType: PROTO.CardanoAddressType.REWARD, stakingPath },
            }),
        );
    });

    it('signs with the base address for an address path', async () => {
        testMocks.setTrezorConnectFixtures(SIGNED_MESSAGE);

        await sign();

        expect(connect().cardanoSignMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                addressParameters: {
                    path: ADDRESS_PATH,
                    addressType: PROTO.CardanoAddressType.BASE,
                    stakingPath: getStakingPath(ACCOUNT),
                },
            }),
        );
    });
});
