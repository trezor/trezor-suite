import { ALGORITHM_IDS } from '../../src/constants/cardano';

const legacyResults = {
    beforeMessageSigning: {
        rules: ['<2.6.5', '1'],
        success: false,
    },
};

export default {
    method: 'cardanoSignMessage',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Sign short ASCII payload hash',
            params: {
                signingPath: "m/1852'/1815'/0'/0/0",
                payload: '54657374',
                hashPayload: true,
                displayAscii: true,
            },
            result: {
                payload: '54657374',
                signature:
                    'cde9451e081f325ed9991b5c20f22c7220526f97e646abee71b8fe232e475b8b06a98df28fdec911e81a050d47c0fcbe3b629d38fc12730fb74ab0a5f56f7f05',
                headers: {
                    protected: {
                        1: ALGORITHM_IDS.EdDSA,
                        address: '80f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa',
                    },
                    unprotected: {
                        hashed: true,
                        version: 1,
                    },
                },
            },
            legacyResults: [legacyResults.beforeMessageSigning],
        },
    ],
};
