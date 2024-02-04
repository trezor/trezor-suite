import { ALGORITHM_IDS } from '../../src/constants/cardano';

const legacyResults = {
    beforeMessageSigning: {
        rules: ['<2.6.5', '1'],
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

const headerHashed = (address: string) => {
    const header = headerUnhashed(address);
    header.unprotected.hashed = true;
    return header;
};

/** "HelloTrezor!" repeated 86 times (=1032 bytes) in hex */
const HELLO_TREZOR_86 =
    '48656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f722148656c6c6f5472657a6f7221';

export default {
    method: 'cardanoSignMessage',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Sign short ASCII payload',
            params: {
                signingPath: "m/1852'/1815'/0'/0/0",
                payload: '54657374', // "Test" hex
                hashPayload: false,
                displayAscii: true,
            },
            result: {
                payload: '54657374',
                signature:
                    '1c2c7612840654a56d61b58df36f41a4b47ad4034140ea369269c143f2732b2702c42fa753a8c52a9b662ba02944e43ec95c59cb892bf01cdd4a7f1c9397490c',
                headers: headerUnhashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign short ASCII payload with address parameters',
            params: {
                signingPath: "m/1852'/1815'/0'/0/0",
                payload: '54657374', // "Test" hex
                hashPayload: false,
                displayAscii: true,
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
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign short non-ASCII payload',
            params: {
                signingPath: "m/1852'/1815'/0'/0/0",
                payload: 'ff',
                hashPayload: false,
                displayAscii: false,
            },
            result: {
                payload: 'ff',
                signature:
                    '003a3631d6c7509c2ebfbeb955c7f6a6b214c4283c2cbc10fc7eda6f2237881c7b219e4b28f3004d50cf528ad325b2d4f10425003096f80db58fc160365d920d',
                headers: headerUnhashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign long ASCII payload hash',
            params: {
                signingPath: "m/1852'/1815'/0'/0/0",
                payload: HELLO_TREZOR_86,
                hashPayload: true,
                displayAscii: true,
            },
            result: {
                payload: HELLO_TREZOR_86,
                signature:
                    '39dba8107fb840b0aeff3f45eaddf9612cd4fd640a18cbe28ea2448b8ba2fea99b67cd9662a46cc7a70e1ad0d6399008d5fad9d67ddb437a623b594bf93b8e0f',
                headers: headerHashed('80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa'),
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Sign long ASCII payload without hashing',
            params: {
                signingPath: "m/1852'/1815'/0'/0/0",
                payload: HELLO_TREZOR_86,
                hashPayload: false,
                displayAscii: true,
            },
            result: false,
            legacyResults: [legacyResults.beforeMessageSigning],
        },
        {
            description: 'Display ambigous-looking " " ASCII payload',
            params: {
                signingPath: "m/1852'/1815'/0'/0/0",
                payload: '20', // " " (single space) hex
                hashPayload: false,
                displayAscii: true,
            },
            result: false,
            legacyResults: [legacyResults.beforeMessageSigning],
        },
    ],
};
