import { ESLint } from 'eslint';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { localRulesConfig } from './localRulesConfig.mjs';
import { repoRoot } from './workspaceRoots.mjs';

// The shared config is loaded from the workspace directory, as from a workspace `eslint.config.mjs`.
const getEnabledRules = async ({ workspace, filename }) => {
    const eslint = new ESLint({
        cwd: `${repoRoot}${workspace}`,
        overrideConfigFile: true,
        overrideConfig: localRulesConfig,
    });
    const config = await eslint.calculateConfigForFile(`${repoRoot}${workspace}/${filename}`);

    return Object.entries(config.rules)
        .filter(([, [severity]]) => severity !== 0)
        .map(([ruleId]) => ruleId);
};

for (const workspace of ['suite-common/wallet-core', 'suite-common/address']) {
    test(`applies the suite-common rules in ${workspace}`, async () => {
        const enabledRules = await getEnabledRules({ workspace, filename: 'src/index.ts' });

        for (const ruleId of [
            'local-rules/no-package-deep-imports',
            'local-rules/analytics-event-name',
            'local-rules/no-suite-imports-in-suite-common',
            'local-rules/enforce-named-parameter-types',
        ]) {
            assert.ok(enabledRules.includes(ruleId), ruleId);
        }
    });
}

test('applies the named parameter types rule in the Suite app package', async () => {
    const enabledRules = await getEnabledRules({
        workspace: 'packages/suite',
        filename: 'src/actions/suite/suiteActions.ts',
    });

    assert.ok(enabledRules.includes('local-rules/enforce-named-parameter-types'));
    assert.ok(!enabledRules.includes('local-rules/no-package-deep-imports'));
});

test('keeps the app-layer rules out of reusable packages', async () => {
    const enabledRules = await getEnabledRules({
        workspace: 'packages/utils',
        filename: 'src/index.ts',
    });

    assert.ok(!enabledRules.includes('local-rules/no-package-deep-imports'));
    assert.ok(!enabledRules.includes('local-rules/enforce-named-parameter-types'));
});
