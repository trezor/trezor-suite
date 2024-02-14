const { withEntitlementsPlist } = require('expo/config-plugins');

// This disables push notifications. Even though we have them turned off by default
// eas fails in Fastlane step because there is some legacy bug.
// More here: https://github.com/expo/eas-cli/issues/987
const withRemoveiOSNotificationEntitlement = config => {
    return withEntitlementsPlist(config, mod => {
        delete mod.modResults['aps-environment'];
        return mod;
    });
};

module.exports = withRemoveiOSNotificationEntitlement;
