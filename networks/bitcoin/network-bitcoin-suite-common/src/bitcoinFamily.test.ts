import {
    type DeviceIdentity,
    type GetTrezorConnect,
    asDeviceUniquePath,
} from '@trezor/connect-common';
import { mock } from '@trezor/dependency-injection';
import {
    type OpenAccount,
    type SignChoiceOptionId,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type BitcoinFamilyDeps, bitcoinFamily } from './bitcoinFamily';

type BitcoinConnect = ReturnType<BitcoinFamilyDeps['getTrezorConnect']>;

const DEVICE_PATH = asDeviceUniquePath('1');
const DEVICE: DeviceIdentity = { path: DEVICE_PATH, instance: 0 };
const SIGNATURE = 'SIGNATURE';
const CANCELLED = { code: 'Method_Cancel', message: 'Cancelled' } as const;

const account: OpenAccount = {
    symbol: asNetworkSymbol('btc'),
    accountType: 'normal',
    index: 0,
    path: "m/84'/0'/0'",
    descriptor: 'zpub',
    addresses: {
        unused: [{ path: "m/84'/0'/0'/0/2", address: 'unused-2' }],
        used: [
            { path: "m/84'/0'/0'/0/0", address: 'used-0' },
            { path: "m/84'/0'/0'/0/1", address: 'used-1' },
        ],
        change: [{ path: "m/84'/0'/0'/1/0", address: 'change-0' }],
    },
};

const createConnect = () => ({
    signMessage: mock<BitcoinConnect['signMessage']>(),
    verifyMessage: mock<BitcoinConnect['verifyMessage']>(),
    // Not exercised here; a plain stub satisfies both overloads of the method.
    getAddress: (): never => {
        throw new Error('getAddress is not expected to be called.');
    },
});

const createSigning = (
    connect: ReturnType<typeof createConnect>,
    accountType?: OpenAccount['accountType'],
) => {
    const deps: BitcoinFamilyDeps = {
        getTrezorConnect: mock<GetTrezorConnect<keyof BitcoinConnect>>(() => connect),
    };
    const { messageSigning } = bitcoinFamily.createNetwork(deps, {
        symbol: 'btc',
        backend: 'blockbook',
        accountType,
    }).capabilities;

    if (messageSigning === undefined) {
        throw new Error('Bitcoin is expected to sign messages.');
    }

    return messageSigning;
};

const getFormatId = (signing: ReturnType<typeof createSigning>, id: string): SignChoiceOptionId => {
    const option = signing
        .getChoices(account)
        .find(({ key }) => key === 'format')
        ?.options.find(candidate => candidate.id === id);

    if (option === undefined) {
        throw new Error(`Format ${id} is expected to be offered.`);
    }

    return option.id;
};

describe('bitcoinFamily message signing', () => {
    it('is not available for account types without sign & verify', () => {
        const connect = createConnect();
        const deps: BitcoinFamilyDeps = { getTrezorConnect: () => connect };

        expect(
            bitcoinFamily.createNetwork(deps, {
                symbol: 'btc',
                backend: 'blockbook',
                accountType: 'taproot',
            }).capabilities.messageSigning,
        ).toBeUndefined();
    });

    it('offers both signature formats, except to legacy accounts', () => {
        const signing = createSigning(createConnect());

        expect(
            signing.getChoices(account).map(({ key, options }) => [key, options.map(o => o.id)]),
        ).toEqual([['format', ['default', 'electrum']]]);
        expect(signing.getChoices({ ...account, accountType: 'legacy' })).toEqual([]);
    });

    it('groups fresh, used and change addresses, newest first', () => {
        const signing = createSigning(createConnect());

        const groups = signing.getSignAddressGroups({ account, touchedAddresses: [] });

        expect(
            groups.map(({ label, addresses }) => [label?.id, addresses.map(a => a.address)]),
        ).toEqual([
            ['TR_ADDRESSES_FRESH', ['unused-2']],
            ['TR_ADDRESSES_USED', ['used-1', 'used-0']],
            ['TR_ADDRESSES_CHANGE', ['change-0']],
        ]);
    });

    it('signs in the electrum format without the script type', async () => {
        const connect = createConnect();
        connect.signMessage.mockResolvedValue({
            success: true,
            payload: { address: 'used-0', signature: SIGNATURE },
            device: { path: DEVICE_PATH, state: undefined },
        });
        const signing = createSigning(connect);

        const result = await signing.sign({
            device: DEVICE,
            account,
            path: "m/84'/0'/0'/0/0",
            message: 'hello',
            isHex: false,
            selection: { format: getFormatId(signing, 'electrum') },
        });

        expect(result).toEqual({
            success: true,
            payload: { signature: SIGNATURE, address: 'used-0' },
        });
        expect(connect.signMessage).toHaveBeenCalledWith({
            device: DEVICE,
            path: "m/84'/0'/0'/0/0",
            coin: 'btc',
            message: 'hello',
            hex: false,
            no_script_type: true,
        });
    });

    it('signs with the format typed by Bitcoin, as the closed network offers it', async () => {
        const connect = createConnect();
        connect.signMessage.mockResolvedValue({
            success: true,
            payload: { address: 'used-0', signature: SIGNATURE },
            device: { path: DEVICE_PATH, state: undefined },
        });
        const signing = createSigning(connect);

        await signing.signWithParams({
            device: DEVICE,
            account,
            path: "m/84'/0'/0'/0/0",
            message: 'hello',
            isHex: false,
            format: 'electrum',
        });

        expect(connect.signMessage).toHaveBeenCalledWith(
            expect.objectContaining({ no_script_type: true }),
        );
    });

    it('passes a device failure through unchanged', async () => {
        const connect = createConnect();
        connect.verifyMessage.mockResolvedValue({ success: false, error: CANCELLED });
        const signing = createSigning(connect);

        const result = await signing.verify?.({
            device: DEVICE,
            account,
            address: 'used-0',
            message: 'hello',
            signature: SIGNATURE,
            isHex: false,
        });

        expect(result).toEqual({ success: false, error: CANCELLED });
    });

    it('rejects an account of another network without calling the device', async () => {
        const connect = createConnect();
        const signing = createSigning(connect);

        const result = await signing.sign({
            device: DEVICE,
            account: { ...account, symbol: asNetworkSymbol('ltc') },
            path: "m/84'/0'/0'/0/0",
            message: 'hello',
            isHex: false,
        });

        expect(result.success).toBe(false);
        expect(connect.signMessage).not.toHaveBeenCalled();
    });
});
