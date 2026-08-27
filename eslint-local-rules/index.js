const path = require('path');

require('ts-node').register({
    transpileOnly: true,
    project: path.join(__dirname, 'tsconfig.json'),
});

const { analyticsEventNameRule } = require('./analyticsEventNameRule');
const { noOverrideDsComponentRule } = require('./noOverrideDsComponentRule');
const { noPackageDeepImportsRule } = require('./noPackageDeepImportsRule');
const { noSuiteImportsInSuiteCommonRule } = require('./noSuiteImportsInSuiteCommonRule');
const { noUnusedIntersectionMembersRule } = require('./noUnusedIntersectionMembersRule');

module.exports = {
    'analytics-event-name': analyticsEventNameRule,
    'no-override-ds-component': noOverrideDsComponentRule,
    'no-package-deep-imports': noPackageDeepImportsRule,
    'no-suite-imports-in-suite-common': noSuiteImportsInSuiteCommonRule,
    'no-unused-intersection-members': noUnusedIntersectionMembersRule,
};
