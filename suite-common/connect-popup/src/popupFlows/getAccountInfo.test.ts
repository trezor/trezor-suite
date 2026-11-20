import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import TrezorConnect from '@trezor/connect';

import { type PopupFlowParams } from './CommonPopupFlow';
import { GetAccountInfo } from './getAccountInfo';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: {
        call: jest.fn(),
        getPublicKey: jest.fn(),
        rippleGetAddress: jest.fn(),
        getAccountInfo: jest.fn(),
    },
}));

const PATH = "m/84'/0'/0'";
const ok = <T>(payload: T) => Promise.resolve({ success: true as const, payload });

const createFlow = (payload: PopupFlowParams<'getAccountInfo'>['payload']) =>
    new GetAccountInfo(
        {
            method: 'getAccountInfo',
            payload,
            source: { type: 'web', origin: 'https://app.example', manifest: { appName: 'app' } },
        },
        {
            dispatch: jest.fn(),
            getState: () => ({ device: { selectedDevice: mockSuiteDevice() } }),
        },
    );

describe('GetAccountInfo', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(TrezorConnect.getAccountInfo).mockImplementation((params: any) =>
            ok({ descriptor: params.descriptor, balance: '1' } as any),
        );
    });

    it('describes each account by Connect, with its path standing in for its descriptor', async () => {
        jest.mocked(TrezorConnect.call).mockImplementation(({ coin }: any) =>
            ok({ info: coin, requiredPermissions: [{ permission: 'read_account_info', coin }] }),
        );
        const flow = createFlow({
            bundle: [
                { coin: 'btc', path: PATH },
                { coin: 'ltc', descriptor: 'ltub' },
                { coin: 'btc', descriptor: 'zpub' },
            ],
        });

        await expect(flow['getMethodInfo']()).resolves.toEqual({
            info: 'Export info of multiple accounts',
            requiredPermissions: [
                { permission: 'read_account_info', coin: 'btc' },
                { permission: 'read_account_info', coin: 'ltc' },
            ],
            useUi: true,
        });
        expect(TrezorConnect.call).toHaveBeenCalledWith({
            coin: 'btc',
            descriptor: PATH,
            method: 'getAccountInfo',
            __info: true,
        });
    });

    it('takes the title of a single account from Connect', async () => {
        jest.mocked(TrezorConnect.call).mockReturnValue(
            ok({ info: 'Export Bitcoin account info', requiredPermissions: [] }),
        );

        await expect(
            createFlow({ coin: 'btc', descriptor: 'zpub' })['getMethodInfo'](),
        ).resolves.toEqual({
            info: 'Export Bitcoin account info',
            requiredPermissions: [],
            useUi: false,
        });
    });

    it('derives the descriptor of a bitcoin account on the device', async () => {
        jest.mocked(TrezorConnect.getPublicKey).mockReturnValue(
            ok({
                xpub: 'xpub',
                xpubSegwit: 'zpub',
                descriptorChecksum: 'sum',
                descriptor: 'wpkh',
            } as any),
        );

        await expect(
            createFlow({ coin: 'btc', path: PATH })['callMethod']({ coin: 'btc', path: PATH }),
        ).resolves.toEqual({
            success: true,
            payload: {
                descriptor: 'zpub',
                balance: '1',
                legacyXpub: 'xpub',
                descriptorChecksum: 'sum',
                outputDescriptorBip380: 'wpkh',
                path: PATH,
            },
        });
        expect(TrezorConnect.getPublicKey).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'btc', path: PATH, showOnTrezor: false }),
        );
        expect(TrezorConnect.getAccountInfo).toHaveBeenCalledWith({
            coin: 'btc',
            descriptor: 'zpub',
        });
    });

    it('derives an account of a coin Suite does not have as a bitcoin-like one', async () => {
        jest.mocked(TrezorConnect.getPublicKey).mockReturnValue(ok({ xpub: 'xpub' } as any));
        const payload = { coin: 'grs', path: "m/44'/17'/0'" } as const;

        await expect(createFlow(payload)['callMethod'](payload)).resolves.toMatchObject({
            payload: { descriptor: 'xpub', path: payload.path },
        });
        expect(TrezorConnect.getPublicKey).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'grs', path: payload.path }),
        );
    });

    it('derives the address of an account of another network on the device', async () => {
        jest.mocked(TrezorConnect.rippleGetAddress).mockReturnValue(
            ok({ address: 'raddress' } as any),
        );
        const payload = { coin: 'xrp', path: "m/44'/144'/0'/0/0" } as const;

        await expect(createFlow(payload)['callMethod'](payload)).resolves.toMatchObject({
            payload: { descriptor: 'raddress', path: payload.path },
        });
    });

    it('reads an account given by its descriptor only from the backend', async () => {
        const payload = { coin: 'btc', descriptor: 'zpub', details: 'txs' } as const;

        await expect(createFlow(payload)['callMethod'](payload)).resolves.toEqual({
            success: true,
            payload: { descriptor: 'zpub', balance: '1', path: undefined },
        });
        expect(TrezorConnect.getPublicKey).not.toHaveBeenCalled();
        expect(TrezorConnect.getAccountInfo).toHaveBeenCalledWith(payload);
    });

    it('answers an account of a bundle the backend fails to read with null', async () => {
        jest.mocked(TrezorConnect.getAccountInfo)
            .mockReturnValueOnce(
                Promise.resolve({
                    success: false,
                    error: { code: 'Backend_Error', message: 'error' },
                } as any),
            )
            .mockImplementationOnce((params: any) => ok({ descriptor: params.descriptor } as any));
        const payload: PopupFlowParams<'getAccountInfo'>['payload'] = {
            bundle: [
                { coin: 'btc', descriptor: 'xpub' },
                { coin: 'btc', descriptor: 'zpub' },
            ],
        };

        await expect(createFlow(payload)['callMethod'](payload)).resolves.toEqual({
            success: true,
            payload: [null, { descriptor: 'zpub', path: undefined }],
        });
    });

    it('stops answering a bundle once the call is cancelled', async () => {
        const error = { code: 'Method_Cancel', message: 'cancelled' };
        jest.mocked(TrezorConnect.getAccountInfo).mockReturnValueOnce(
            Promise.resolve({ success: false, error } as any),
        );
        const payload: PopupFlowParams<'getAccountInfo'>['payload'] = {
            bundle: [
                { coin: 'btc', descriptor: 'xpub' },
                { coin: 'btc', descriptor: 'zpub' },
            ],
        };

        await expect(createFlow(payload)['callMethod'](payload)).rejects.toEqual(error);
        expect(TrezorConnect.getAccountInfo).toHaveBeenCalledTimes(1);
    });

    it('fails a bundle once an account cannot be derived on the device', async () => {
        const error = { code: 'Failure_PinCancelled', message: 'PIN cancelled' };
        jest.mocked(TrezorConnect.getPublicKey).mockReturnValue(
            Promise.resolve({ success: false, error } as any),
        );
        const payload: PopupFlowParams<'getAccountInfo'>['payload'] = {
            bundle: [
                { coin: 'btc', path: PATH },
                { coin: 'btc', path: "m/84'/0'/1'" },
            ],
        };

        await expect(createFlow(payload)['callMethod'](payload)).rejects.toEqual(error);
        expect(TrezorConnect.getPublicKey).toHaveBeenCalledTimes(1);
    });

    it('fails a single account with the error of Connect', async () => {
        const error = { code: 'Backend_Error', message: 'error' };
        jest.mocked(TrezorConnect.getAccountInfo).mockReturnValue(
            Promise.resolve({ success: false, error } as any),
        );
        const payload = { coin: 'btc', descriptor: 'zpub' } as const;

        await expect(createFlow(payload)['callMethod'](payload)).rejects.toEqual(error);
    });
});
