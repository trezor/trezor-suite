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

for (const code of [
    "import Animated from 'react-native-reanimated';",
    "import Motion from 'react-native-reanimated';",
    "import { default as Motion } from 'react-native-reanimated';",
    "import * as Reanimated from 'react-native-reanimated';",
    "import { View as MotionView } from 'react-native-reanimated';",
    "import { ScrollView, useAnimatedStyle } from 'react-native-reanimated';",
    "import { Text, Image, FlatList } from 'react-native-reanimated';",
    "import { createAnimatedComponent as animate } from 'react-native-reanimated';",
    "export { default as Animated } from 'react-native-reanimated';",
    "export * from 'react-native-reanimated';",
    "import { AnimatedView } from 'react-native-reanimated/src/component/View';",
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
