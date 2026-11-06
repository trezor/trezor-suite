import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// The config reads both variables at import time, so they are set the way the runner sets them
// for a default run before anything below imports it.
process.env.ESLINT_RULE_FILTER_ACTIVE = 'true';
delete process.env.ESLINT_RULE_SET;

const { ESLint } = await import('eslint');
const { createRuleFilter, parseRuleSet, typeAwareRuleIds } = await import('./ruleSets.mjs');
const { createRunnerOptionsModuleURL, getWorkerCount } = await import('./runnerOptions.mjs');

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
// Virtual: `lintText` only needs the path to resolve the config and the `src/**` overrides.
const filePath = `${repositoryRoot}packages/eslint/src/RunnerFixture.ts`;
const typeAwareRuleId = '@typescript-eslint/no-unnecessary-type-assertion';

test('defaults to the basic rule set and accepts every rule set by name', () => {
    assert.equal(parseRuleSet(undefined), 'basic');
    assert.equal(parseRuleSet(''), 'basic');
    assert.equal(parseRuleSet('basic'), 'basic');
    assert.equal(parseRuleSet('type-aware'), 'type-aware');
    assert.equal(parseRuleSet('all'), 'all');
});

test('rejects a value that would silently skip a rule set', () => {
    assert.throws(() => parseRuleSet('true'), /Unsupported ESLINT_RULE_SET/);
});

test('treats the type-aware rules and the type-aware local rule as type-aware', () => {
    assert.equal(typeAwareRuleIds.has(typeAwareRuleId), true);
    assert.equal(typeAwareRuleIds.has('local-rules/no-unused-intersection-members'), true);
    assert.equal(typeAwareRuleIds.has('react-hooks/purity'), false);
});

test('the basic and type-aware filters split the rules without overlap', () => {
    const basicFilter = createRuleFilter('basic');
    const typeAwareFilter = createRuleFilter('type-aware');

    for (const ruleId of [typeAwareRuleId, 'react-hooks/purity', 'import/order']) {
        assert.notEqual(
            basicFilter({ ruleId }),
            typeAwareFilter({ ruleId }),
            `${ruleId} must belong to exactly one rule set`,
        );
    }
    assert.equal(basicFilter({ ruleId: 'react-hooks/purity' }), true);
    assert.equal(typeAwareFilter({ ruleId: typeAwareRuleId }), true);
});

test('runs every configured rule when both sets are selected', () => {
    assert.equal(createRuleFilter('all'), undefined);
});

test('spawns workers only for workspaces large enough to amortize them', () => {
    // A four-core CI runner where Nx already runs three tasks at once.
    assert.equal(getWorkerCount({ ruleSet: 'basic', fileCount: 125, cpuCount: 4 }), 1);
    assert.equal(getWorkerCount({ ruleSet: 'basic', fileCount: 590, cpuCount: 4 }), 1);
    assert.equal(getWorkerCount({ ruleSet: 'basic', fileCount: 5100, cpuCount: 4 }), 2);
    assert.equal(getWorkerCount({ ruleSet: 'type-aware', fileCount: 590, cpuCount: 4 }), 1);
    assert.equal(getWorkerCount({ ruleSet: 'type-aware', fileCount: 5100, cpuCount: 4 }), 2);
    // A ten-core workstation.
    assert.equal(getWorkerCount({ ruleSet: 'basic', fileCount: 5100, cpuCount: 10 }), 5);
    assert.equal(getWorkerCount({ ruleSet: 'type-aware', fileCount: 5100, cpuCount: 10 }), 3);
    assert.equal(getWorkerCount({ ruleSet: 'all', fileCount: 5100, cpuCount: 10 }), 3);
    assert.equal(getWorkerCount({ ruleSet: 'basic', fileCount: 0, cpuCount: 10 }), 1);
});

const lintWithBasicRules = async code => {
    const eslint = await ESLint.fromOptionsModule(
        createRunnerOptionsModuleURL({
            ruleSet: 'basic',
            patterns: [],
            fix: false,
            warnIgnored: true,
            cwd: repositoryRoot,
        }),
    );
    const [result] = await eslint.lintText(code, { filePath });
    assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));

    return result.messages;
};

test('a basic run leaves a directive suppressing a type-aware rule alone', async () => {
    const messages = await lintWithBasicRules(
        [
            'const count = 1;',
            `// eslint-disable-next-line ${typeAwareRuleId}`,
            'export const total = count as number;',
            '',
        ].join('\n'),
    );

    assert.deepEqual(messages, []);
});

test('a basic run still reports an unused directive for a basic rule', async () => {
    const messages = await lintWithBasicRules(
        ['// eslint-disable-next-line no-console', 'export const total = 1;', ''].join('\n'),
    );

    assert.equal(messages.length, 1, JSON.stringify(messages));
    assert.match(messages[0].message, /Unused eslint-disable directive/);
});
