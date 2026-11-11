import { CARDANO, type DeviceIdentity, asDeviceUniquePath } from '@trezor/connect-common';
import { mock } from '@trezor/dependency-injection';
import type { OpenAccount } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { MessagesSchema } from '@trezor/protobuf';

import { type CardanoFamilyDeps, cardanoFamily } from './cardanoFamily';

type CardanoConnect = ReturnType<CardanoFamilyDeps['getTrezorConnect']>;

const DEVICE_PATH = asDeviceUniquePath('1');
const DEVICE: DeviceIdentity = { path: DEVICE_PATH, instance: 0 };
const STAKING_PATH = "m/1852'/1815'/0'/2/0";

const account: OpenAccount = {
    symbol: asNetworkSymbol('ada'),
    accountType: 'normal',
    index: 0,
    path: "m/1852'/1815'/0'",
    descriptor: 'xpub',
    addresses: {
        unused: [{ path: "m/1852'/1815'/0'/0/1", address: 'addr-1' }],
        used: [{ path: "m/1852'/1815'/0'/0/0", address: 'addr-0' }],
        change: [],
    },
    misc: { staking: { address: 'stake1' } },
};

const createSigning = () => {
    const cardanoSignMessage = mock<CardanoConnect['cardanoSignMessage']>(() =>
        Promise.resolve({
            success: true,
            payload: {
                coseSignature: 'cose-signature',
                coseKey: 'cose-key',
                pubKey: 'raw-key',
                headers: {
                    protected: { 1: CARDANO.ALGORITHM_IDS.EdDSA, address: 'stake1' },
                    unprotected: { hashed: false, version: 1 },
                },
                payload: '',
                signature: '',
            },
            device: { path: DEVICE_PATH, state: undefined },
        }),
    );
    const deps: CardanoFamilyDeps = { getTrezorConnect: () => ({ cardanoSignMessage }) };
    const { messageSigning } = cardanoFamily.createNetwork(deps, {
        symbol: 'ada',
        backend: 'blockfrost',
    }).capabilities;

    if (messageSigning === undefined) {
        throw new Error('Cardano is expected to sign messages.');
    }

    return { messageSigning, cardanoSignMessage };
};

const getFormat = (signing: ReturnType<typeof createSigning>['messageSigning'], id: string) =>
    signing.getFormatChoice(account)?.options.find(({ format }) => format === id)?.format;

describe('cardanoFamily message signing', () => {
    it('signs only, with the stake address offered first', () => {
        const { messageSigning } = createSigning();

        expect(messageSigning.verify).toBeUndefined();
        expect(messageSigning.labels.title.id).toBe('TR_SIGN_MESSAGE');
        expect(
            messageSigning
                .getSignAddressGroups({ account, touchedAddresses: [] })
                .map(({ label, addresses }) => [label?.id, addresses.map(a => a.path)]),
        ).toEqual([
            ['TR_STAKING_STAKE_ADDRESS', [STAKING_PATH]],
            ['TR_ADDRESSES_FRESH', ["m/1852'/1815'/0'/0/1"]],
            ['TR_ADDRESSES_USED', ["m/1852'/1815'/0'/0/0"]],
        ]);
    });

    it('returns the COSE key when that format was chosen', async () => {
        const { messageSigning } = createSigning();

        const result = await messageSigning.sign({
            device: DEVICE,
            account,
            path: "m/1852'/1815'/0'/0/0",
            message: 'hello',
            isHex: false,
            format: getFormat(messageSigning, 'cose'),
        });

        expect(result).toEqual({
            success: true,
            payload: { signature: 'cose-signature', publicKey: 'cose-key', address: 'stake1' },
        });
    });

    it('signs with the stake address as a reward address', async () => {
        const { messageSigning, cardanoSignMessage } = createSigning();

        await messageSigning.sign({
            device: DEVICE,
            account,
            path: STAKING_PATH,
            message: 'hello',
            isHex: false,
        });

        expect(cardanoSignMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: Buffer.from('hello', 'utf8').toString('hex'),
                addressParameters: {
                    addressType: MessagesSchema.CardanoAddressType.REWARD,
                    stakingPath: STAKING_PATH,
                },
                derivationType: 1,
            }),
        );
    });

    it('rejects an account without a stake address', async () => {
        const { messageSigning, cardanoSignMessage } = createSigning();

        const result = await messageSigning.sign({
            device: DEVICE,
            account: { ...account, misc: undefined },
            path: STAKING_PATH,
            message: 'hello',
            isHex: false,
        });

        expect(result.success).toBe(false);
        expect(cardanoSignMessage).not.toHaveBeenCalled();
    });
});
