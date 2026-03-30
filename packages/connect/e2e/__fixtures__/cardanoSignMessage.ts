import { ALGORITHM_IDS } from '@trezor/connect-common/src/constants/cardano';

const legacyResults = {
    beforeMessageSigning: {
        rules: ['<2.9.1', '1'],
        success: false,
    },
};

const headerUnhashed = (address: string) => ({
    protected: {
        1: ALGORITHM_IDS.EdDSA,
        address,
    },
    unprotected: {
        hashed: false,
        version: 1,
    },
});

/** "HelloTrezor!" repeated 86 times (=1032 bytes) in hex */
const HELLO_TREZOR_86 = '48656c6c6f5472657a6f7221'.repeat(86);

export default {
    method: 'cardanoSignMessage',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Sign short ASCII payload',
            params: {
                path: "m/1852'/1815'/0'/0/0",
                payload: '54657374', // "Test" hex
            },
            result: {
                payload: '54657374',
                signature:
                    '1c2c7612840654a56d61b58df36f41a4b47ad4034140ea369269c143f2732b2702c42fa753a8c52a9b662ba02944e43ec95c59cb892bf01cdd4a7f1c9397490c',
                headers: headerUnhashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
                pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign short ASCII payload and display as hex',
            params: {
                path: "m/1852'/1815'/0'/0/0",
                payload: '54657374', // "Test" hex
                preferHexDisplay: true,
            },
            result: {
                payload: '54657374',
                signature:
                    '1c2c7612840654a56d61b58df36f41a4b47ad4034140ea369269c143f2732b2702c42fa753a8c52a9b662ba02944e43ec95c59cb892bf01cdd4a7f1c9397490c',
                headers: headerUnhashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
                pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign short ASCII payload with address parameters',
            params: {
                path: "m/1852'/1815'/0'/0/0",
                payload: '54657374', // "Test" hex
                networkId: 1,
                protocolMagic: 764824073,
                addressParameters: {
                    addressType: 0,
                    path: "m/1852'/1815'/0'/0/0",
                    stakingPath: "m/1852'/1815'/0'/2/0",
                },
            },
            result: {
                payload: '54657374',
                signature:
                    '31ddc8531e70f9be45af9812ab466749e2ed63d5be626956f3341867f518c29ad669380766a9e5ceefe9f099211809831892cbd3161ca4c935e1b574f59fb406',
                headers: headerUnhashed(
                    '0180f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa122a946b9ad3d2ddf029d3a828f0468aece76895f15c9efbd69b4277',
                ),
                pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign short non-ASCII payload',
            params: {
                path: "m/1852'/1815'/0'/0/0",
                payload: 'ff',
            },
            result: {
                payload: 'ff',
                signature:
                    '003a3631d6c7509c2ebfbeb955c7f6a6b214c4283c2cbc10fc7eda6f2237881c7b219e4b28f3004d50cf528ad325b2d4f10425003096f80db58fc160365d920d',
                headers: headerUnhashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
                pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Display ambigous-looking " " ASCII payload as hex',
            params: {
                path: "m/1852'/1815'/0'/0/0",
                payload: '20', // " " (single space) hex
            },
            result: {
                payload: '20',
                signature:
                    '5f3c4a4240b48686cb3ee95ed75c9152222023b630c6a0daab3c2a028ba484e98114451aa707139d65e2e6b9af7f9d45f82bfc75c752179877aee2675a662d05',
                headers: headerUnhashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
                pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign long ASCII payload',
            params: {
                path: "m/1852'/1815'/0'/0/0",
                payload: HELLO_TREZOR_86,
            },
            result: {
                payload: HELLO_TREZOR_86,
                signature:
                    '59adf3050177a25a4682c81480dc803e2eb69a22b885f157153c3e7cee76e11369db8e9a8d15872facfc979ac6ae443375da5b0b90aac16a38c9f88021a0bd01',
                headers: headerUnhashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
                pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
    ],
};
