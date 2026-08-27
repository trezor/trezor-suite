import type { Rule } from 'eslint';

import { analyticsEventNameRule } from './analyticsEventNameRule';
import { noOverrideDsComponentRule } from './noOverrideDsComponentRule';
import { noPackageDeepImportsRule } from './noPackageDeepImportsRule';
import { noSuiteImportsInSuiteCommonRule } from './noSuiteImportsInSuiteCommonRule';
import { noUnusedIntersectionMembersRule } from './noUnusedIntersectionMembersRule';

export const rules = {
    'analytics-event-name': analyticsEventNameRule,
    'no-override-ds-component': noOverrideDsComponentRule,
    'no-package-deep-imports': noPackageDeepImportsRule,
    'no-suite-imports-in-suite-common': noSuiteImportsInSuiteCommonRule,
    'no-unused-intersection-members': noUnusedIntersectionMembersRule,
} as const satisfies Record<string, Rule.RuleModule>;
