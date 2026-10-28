import { isMockReferralScenario, mockReferralScenarios } from './mockReferAFriendData';
import { ReferAFriendMock } from './referAFriendServer';

// Usage: yarn workspace @trezor/e2e-utils refer-a-friend-server [--scenario=<scenario>]
const scenarioArgument = process.argv
    .find(argument => argument.startsWith('--scenario='))
    ?.slice('--scenario='.length);
const scenario = scenarioArgument ?? 'allStates';

if (!isMockReferralScenario(scenario)) {
    console.error(
        `Unknown scenario "${scenario}", use one of: ${Object.keys(mockReferralScenarios).join(', ')}`,
    );
    process.exit(1);
}

new ReferAFriendMock({ scenario }).start();
