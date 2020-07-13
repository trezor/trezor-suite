/* eslint-disable @typescript-eslint/camelcase */

// @beta 

const shareOneOfThree = [
    'gesture', 'necklace', 'academic', 'acid', 'deadline', 'width', 'armed', 'render', 'filter', 'bundle', 'failure', 'priest', 'injury', 'endorse', 'volume', 'terminal', 'lunch', 'drift', 'diploma', 'rainbow',
];
const shareTwoOfThree = [
    'gesture', 'necklace', 'academic', 'agency', 'alpha', 'ecology', 'visitor', 'raisin', 'yelp', 'says', 'findings', 'bulge', 'rapids', 'paper', 'branch', 'spelling', 'cubic', 'tactics', 'formal', 'disease',
];

describe('Onboarding - T2 in recovery mode', () => {
    beforeEach(() => {
        cy.resetDb();
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();

    });

    it('Initial run with device that is already in recovery mode', () => {
        // start recovery with device
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step').click();
        cy.task('startEmu', { version: '2.3.1', wipe: true });
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
        cy.task('stopEmu');
        cy.getTestElement('@onboarding/unexpected-state/reconnect');

        cy.resetDb();
        cy.reload();
        cy.task('startEmu', { version: '2.3.1', wipe: false });

        cy.log('Welcome and analytics screen are not affected');
        cy.getTestElement('@welcome/continue-button').click();
        cy.getTestElement('@analytics/go-to-onboarding-button').click();
        cy.log('Once we get into first onboarding screen, we can see "recovery mode"');
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.log('At this moment, device and client communicate again');
    });

    // https://github.com/trezor/trezor-suite/issues/2049
    it(`
        1. start recovery
        2. enter first shamir share
        3. reconnect device
        4. enter second shamir share
        5. recovery is finished
    `, () => {
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step').click();
        cy.task('startEmu', { version: '2.3.1', wipe: true });
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
        cy.task('selectNumOfWordsEmu', 20);
        cy.task('sendDecision');
        for (let i = 0; i<shareOneOfThree.length; i++) {
            cy.task('inputEmu', shareOneOfThree[i]);
        }
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('stopEmu');
        cy.getTestElement('@onboarding/unexpected-state/reconnect');

        cy.task('startEmu', { version: '2.3.1', wipe: false });
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');

        for (let i = 0; i<shareTwoOfThree.length; i++) {
            cy.task('inputEmu', shareTwoOfThree[i]);
        }

        cy.task('sendDecision');
        cy.getTestElement('@onboarding/recovery/continue-button').click();
    });

    // todo: stop recovery and check if back button works as expected in onboarding

});
