import { ESLint } from 'eslint';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

import { typescriptConfig } from './typescriptConfig.mjs';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const nativeFilename = `${repositoryRoot}suite-native/example/src/Component.tsx`;
const ruleId = '@typescript-eslint/no-restricted-imports';

const createEslint = (cwd = repositoryRoot) =>
    new ESLint({
        cwd,
        overrideConfigFile: true,
        overrideConfig: [...typescriptConfig, tseslint.configs.disableTypeChecked],
    });

const eslint = createEslint();

const lintRestrictedImports = async ({ code, filename = nativeFilename, instance = eslint }) => {
    const [result] = await instance.lintText(code, { filePath: filename });
    assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));

    return result.messages.filter(message => message.ruleId === ruleId);
};

test('allows shared Suite services in the CLI app composition root', async () => {
    assert.deepEqual(
        await lintRestrictedImports({
            code: "import { createNetworkModulesCompositionRoot } from '@suite-common/networks';",
            filename: `${repositoryRoot}suite-cli/app/src/createCliCompositionRoot.ts`,
        }),
        [],
    );
});

test('keeps shared Suite services private outside application packages', async () => {
    const errors = await lintRestrictedImports({
        code: "import { createNetworkModulesCompositionRoot } from '@suite-common/networks';",
        filename: `${repositoryRoot}packages/example/src/index.ts`,
    });

    assert.equal(errors.length, 1);
});

for (const code of [
    "import Animated from 'react-native-reanimated';",
    "import Motion from 'react-native-reanimated';",
    "import { default as Motion } from 'react-native-reanimated';",
    "import * as Reanimated from 'react-native-reanimated';",
    "import { createAnimatedComponent as animate } from 'react-native-reanimated';",
    "export { default as Animated } from 'react-native-reanimated';",
    "export * from 'react-native-reanimated';",
    "import { AnimatedView } from 'react-native-reanimated/src/component/View';",
    "import Lottie from 'lottie-react-native';",
    "import { LottieView } from 'lottie-react-native';",
    "import * as Lottie from 'lottie-react-native';",
    "export * from 'lottie-react-native';",
    "import Lottie from 'lottie-react-native/src/LottieView';",
]) {
    test(`rejects native component import: ${code}`, async () => {
        const errors = await lintRestrictedImports({ code });
        assert.ok(errors.length > 0);
        assert.match(errors[0].message, /@suite-native\/atoms/);
    });
}

for (const code of [
    "import { useAnimatedStyle, useSharedValue, withTiming, FadeIn, ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';",
    "import { type AnimatedProps, type SharedValue } from 'react-native-reanimated';",
    "import type Animated from 'react-native-reanimated';",
    "import type * as Reanimated from 'react-native-reanimated';",
    "import { AnimatedView, AnimatedScrollView, AnimatedText } from '@suite-native/atoms';",
    "import type Lottie from 'lottie-react-native';",
    "import { type AnimationObject, type LottieViewProps } from 'lottie-react-native';",
    "import { LottieView } from '@suite-native/atoms';",
]) {
    test(`allows native hooks, builders, types and atoms: ${code}`, async () => {
        assert.deepEqual(await lintRestrictedImports({ code }), []);
    });
}

test('allows Reanimated imports in animated atom implementations', async () => {
    assert.deepEqual(
        await lintRestrictedImports({
            code: "import Animated, { createAnimatedComponent } from 'react-native-reanimated';",
            filename: `${repositoryRoot}suite-native/atoms/src/Animated/AnimatedView.tsx`,
        }),
        [],
    );
});

test('requires animated atoms inside the rest of the atoms package', async () => {
    const errors = await lintRestrictedImports({
        code: "import Animated from 'react-native-reanimated';",
        filename: `${repositoryRoot}suite-native/atoms/src/Button/Button.tsx`,
    });
    assert.equal(errors.length, 1);
});

test('allows native Lottie imports in the shared animated atom implementation', async () => {
    assert.deepEqual(
        await lintRestrictedImports({
            code: "import Lottie from 'lottie-react-native';",
            filename: `${repositoryRoot}suite-native/atoms/src/Animated/LottieView.tsx`,
        }),
        [],
    );
});

test('requires the shared Lottie atom inside Spinner', async () => {
    const errors = await lintRestrictedImports({
        code: "import Lottie from 'lottie-react-native';",
        filename: `${repositoryRoot}suite-native/atoms/src/Spinner/Spinner.tsx`,
    });
    assert.equal(errors.length, 1);
});

test('applies when a native package loads the shared config from its own directory', async () => {
    const errors = await lintRestrictedImports({
        code: "import Motion from 'react-native-reanimated';",
        filename: `${repositoryRoot}suite-native/app/src/App.tsx`,
        instance: createEslint(`${repositoryRoot}suite-native/app`),
    });
    assert.equal(errors.length, 1);
});

test('does not restrict components outside Suite Native', async () => {
    assert.deepEqual(
        await lintRestrictedImports({
            code: "import Animated from 'react-native-reanimated';",
            filename: `${repositoryRoot}packages/example/src/Component.tsx`,
        }),
        [],
    );
});

test('preserves existing native import restrictions', async () => {
    const errors = await lintRestrictedImports({
        code: "import { ipcMain } from 'electron'; import { foo } from '@trezor/utils/lib/foo';",
    });
    assert.equal(errors.length, 2);
});

for (const filename of [
    `${repositoryRoot}suite-common/icons/src/cryptoIcons.ts`,
    `${repositoryRoot}packages/example/src/icons.ts`,
    `${repositoryRoot}networks/bitcoin/network-bitcoin/src/icons.ts`,
    nativeFilename,
]) {
    test(`allows network asset package roots in ${filename}`, async () => {
        assert.deepEqual(
            await lintRestrictedImports({
                code: "import { bitcoinAssets } from '@trezor/network-bitcoin-assets'; export { ethereumAssets } from '@trezor/network-ethereum-assets';",
                filename,
            }),
            [],
        );
    });

    test(`still requires sectioned implementation imports in ${filename}`, async () => {
        const errors = await lintRestrictedImports({
            code: "import { network } from '@trezor/network-ethereum';",
            filename,
        });
        assert.equal(errors.length, 1);
        assert.match(errors[0].message, /\/constants, \/runtime or \/types/);
    });

    test(`allows sectioned implementation imports in ${filename}`, async () => {
        assert.deepEqual(
            await lintRestrictedImports({
                code: "import { network } from '@trezor/network-ethereum/runtime';",
                filename,
            }),
            [],
        );
    });
}

const suiteCommonDeepImport = "import { EarnFlow } from '@suite-common/suite-types/src/staking';";

for (const filename of [
    `${repositoryRoot}suite-common/wallet-core/src/staking/shared/stakingUtils.ts`,
    `${repositoryRoot}suite-common/wallet-utils/src/stakingUtils.ts`,
    `${repositoryRoot}packages/suite/src/actions/wallet/stakeActions.ts`,
    `${repositoryRoot}packages/suite/src/actions/wallet/stake/stakeFormEthereumActions.ts`,
    `${repositoryRoot}packages/suite/src/hooks/earn/useStakeForm.ts`,
    `${repositoryRoot}packages/suite/src/views/wallet/staking/components/StakingCard.tsx`,
    `${repositoryRoot}packages/suite/src/components/earn/modals/StakeModal.tsx`,
    `${repositoryRoot}suite-native/module-earn/src/hooks/staking/useStakingForm.ts`,
]) {
    test(`rejects deep Suite package imports in the staking tree file ${filename}`, async () => {
        const errors = await lintRestrictedImports({ code: suiteCommonDeepImport, filename });
        assert.equal(errors.length, 1);
        assert.match(errors[0].message, /bypass the public barrel/);
    });

    test(`allows package root and mock imports in the staking tree file ${filename}`, async () => {
        assert.deepEqual(
            await lintRestrictedImports({
                code: "import { EarnFlow } from '@suite-common/suite-types'; import { mockWalletAccount } from '@suite-common/wallet-types/mocks'; import { type EvmHexString } from '@suite-common/schemas/src/evm';",
                filename,
            }),
            [],
        );
    });
}

test('keeps the native component restrictions in the mobile staking tree', async () => {
    const errors = await lintRestrictedImports({
        code: "import Animated from 'react-native-reanimated';",
        filename: `${repositoryRoot}suite-native/module-earn/src/hooks/staking/useStakingForm.ts`,
    });
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /@suite-native\/atoms/);
});

test('applies the staking tree guard when a package loads the config from its own directory', async () => {
    const errors = await lintRestrictedImports({
        code: suiteCommonDeepImport,
        filename: `${repositoryRoot}packages/suite/src/components/earn/modals/StakeModal.tsx`,
        instance: createEslint(`${repositoryRoot}packages/suite`),
    });
    assert.equal(errors.length, 1);
});

test('does not guard deep Suite package imports outside the staking trees', async () => {
    assert.deepEqual(
        await lintRestrictedImports({
            code: suiteCommonDeepImport,
            filename: `${repositoryRoot}packages/suite/src/views/earn/yield/useEarnLayout.tsx`,
        }),
        [],
    );
});
