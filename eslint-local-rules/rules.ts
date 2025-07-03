import type { Rule } from 'eslint';

import { noObjectKeysRule } from './noObjectKeysRule';
import { noOverrideDsComponent } from './noOverrideDsComponent';

export default {
    'no-object-keys': noObjectKeysRule,
    'no-override-ds-component': noOverrideDsComponent,
} satisfies Record<string, Rule.RuleModule>;
