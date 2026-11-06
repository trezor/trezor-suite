import tseslint from 'typescript-eslint';

/**
 * `ESLINT_RULE_SET` names the rule set a lint run enforces:
 * - `basic`, the default: every rule that needs no type information. No TypeScript program is
 *   built, which is what editors and the default `lint:js` run want.
 * - `type-aware`: the rules that need a TypeScript program. CI enforces them in a job of their
 *   own, in parallel with the basic run.
 * - `all`: both sets in one run.
 * @typedef {'basic' | 'type-aware' | 'all'} RuleSet
 */

/** @type {readonly RuleSet[]} */
export const ruleSets = ['basic', 'type-aware', 'all'];

/**
 * @param {string | undefined} value The raw `ESLINT_RULE_SET` value.
 * @returns {RuleSet}
 */
export const parseRuleSet = value => {
    if (value === undefined || value === '') {
        return 'basic';
    }

    const parsed = ruleSets.find(candidate => candidate === value);

    if (parsed === undefined) {
        throw new Error(
            `Unsupported ESLINT_RULE_SET value "${value}": use ${ruleSets.join(', ')} or leave it unset.`,
        );
    }

    return parsed;
};

export const ruleSet = parseRuleSet(process.env.ESLINT_RULE_SET);

/** Whether the parser builds TypeScript programs. Only the type-aware rules read them. */
export const isTypeInformationNeeded = ruleSet !== 'basic';

/**
 * The runner in `bin/eslint.mjs` enforces the rule set with ESLint's `ruleFilter` rather than by
 * turning rules off in the config. ESLint counts a directive that suppresses a rule configured off
 * as unused, so a run enforcing one rule set could not report unused directives at all if the
 * other set were configured off. Under the runner every rule stays configured, the filter picks
 * the set to run, and ESLint ignores directives naming a filtered rule.
 */
export const isRuleFilterActive = process.env.ESLINT_RULE_FILTER_ACTIVE === 'true';

export const areTypeAwareRulesConfigured = isTypeInformationNeeded || isRuleFilterActive;

// Accurate only when every rule is either run or filtered, never configured off.
export const reportUnusedDisableDirectives = areTypeAwareRulesConfigured ? 'warn' : 'off';

/** The rules that need a TypeScript program, which the basic run never builds. */
export const typeAwareRuleIds = new Set([
    ...Object.keys(tseslint.configs.disableTypeChecked.rules),
    'local-rules/no-unused-intersection-members',
]);

/**
 * @param {RuleSet} selectedRuleSet
 * @returns {((rule: { ruleId: string }) => boolean) | undefined} ESLint's `ruleFilter`, or
 * `undefined` when every configured rule runs.
 */
export const createRuleFilter = selectedRuleSet => {
    switch (selectedRuleSet) {
        case 'basic':
            return ({ ruleId }) => !typeAwareRuleIds.has(ruleId);
        case 'type-aware':
            return ({ ruleId }) => typeAwareRuleIds.has(ruleId);
        case 'all':
            return undefined;
    }
};
