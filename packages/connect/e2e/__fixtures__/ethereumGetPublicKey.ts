/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/ethereum/getpublickey.json';

const generatedTests = commonFixtures.tests.flatMap(({ parameters, result }) => ({
    description: parameters.path,
    params: {
        path: parameters.path,
    },
    result: {
        fingerprint: result.fingerprint,
        childNum: result.child_num,
        chainCode: result.chain_code,
        publicKey: result.public_key,
        xpub: result.xpub,
        displayablePublicKey: result.xpub,
    },
}));

// Discovery: first generated path with showOnTrezor:true, so e2e captures the FW screen.
// FW shows the raw compressed public key (33-byte hex), NOT the xpub.
const [firstTest] = generatedTests;
const firstShowOnTrezor = {
    ...firstTest,
    description: `${firstTest?.description} (showOnTrezor)`,
    params: { ...firstTest?.params, showOnTrezor: true },
    // Assert a stable prefix that fits inside the smallest-screen capture.
    deviceScreen: firstTest?.result.publicKey.slice(0, 40),
    // T1B1 emulator's getScreenContent returns a placeholder; old FW renders xpub.
    deviceScreenSkip: ['1', '<2.7.0'],
};

export default {
    method: 'ethereumGetPublicKey',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: [...generatedTests, firstShowOnTrezor],
} satisfies TestCase;
