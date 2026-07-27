import { findKnownPairingCredentials } from './pairing';

describe('pairing', () => {
    it('findKnownPairingCredentials', () => {
        const knownCredentials = [
            {
                host_static_key: '0007070707070707070707070707070707070707070707070707070707070747',
                trezor_static_public_key:
                    '1317c99c16fce04935782ed250cf0cacb12216f739cea55257258a2ff9440763',
                credential:
                    '0a0f0a0d5472657a6f72436f6e6e6563741220f69918996c0afa1045b3625d06e7e816b0c4c4bd3902dfd4cad068b3f2425ec8',
            },
            {
                host_static_key: '0007070707070707070707070707070707070707070707070707070707070747',
                trezor_static_public_key:
                    '2bcdbc9fd7949c3f37aa80a53801f52ec554facfe76118030926294250fd6838',
                credential:
                    '0a110a0d5472657a6f72436f6e6e65637410011220b97509ef252b07dcc70071c9d13dd70746d8a9fb671765049ca74e58b9058d6b',
            },
        ];

        const trezorMaskedStaticPubkey = Buffer.from(
            'be8d024bbcd5ac116e041035fcc6243ce1d77d7075e351c87aa0831fbf46ce66',
            'hex',
        );

        const trezorEphemeralPubkey = Buffer.from(
            'f817f577f24d7ec08c1ea397df2da916e0ee81423961763dc45395e18fc02121',
            'hex',
        );

        const credentials = findKnownPairingCredentials(
            knownCredentials,
            trezorMaskedStaticPubkey,
            trezorEphemeralPubkey,
        );

        expect(credentials).toEqual([knownCredentials[1]]);
    });
});
