const path = require('path');

require('ts-node').register({
    transpileOnly: true,
    project: path.join(__dirname, 'tsconfig.json'),
});

const { analyticsEventNameRule } = require('./analytics-event-name/rule');
const { enforceNamedContractsRule } = require('./enforce-named-contracts/rule');
const { noOverrideDsComponentRule } = require('./no-override-ds-component/rule');
const { noPackageDeepImportsRule } = require('./no-package-deep-imports/rule');
const { noSuiteImportsInSuiteCommonRule } = require('./no-suite-imports-in-suite-common/rule');
const { noUnusedIntersectionMembersRule } = require('./no-unused-intersection-members/rule');

module.exports = {
    'analytics-event-name': analyticsEventNameRule,
    'enforce-named-contracts': enforceNamedContractsRule,
    'no-override-ds-component': noOverrideDsComponentRule,
    'no-package-deep-imports': noPackageDeepImportsRule,
    'no-suite-imports-in-suite-common': noSuiteImportsInSuiteCommonRule,
    'no-unused-intersection-members': noUnusedIntersectionMembersRule,
};
