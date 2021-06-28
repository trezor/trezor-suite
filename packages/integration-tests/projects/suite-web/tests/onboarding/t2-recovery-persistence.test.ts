/* eslint-disable @typescript-eslint/naming-convention */

// @group:onboarding
// @retry=2

const shareOneOfThree = [
    'gesture',
    'necklace',
    'academic',
    'acid',
    'deadline',
    'width',
    'armed',
    'render',
    'filter',
    'bundle',
    'failure',
    'priest',
    'injury',
    'endorse',
    'volume',
    'terminal',
    'lunch',
    'drift',
    'diploma',
    'rainbow',
];
const shareTwoOfThree = [
    'gesture',
    'necklace',
    'academic',
    'agency',
    'alpha',
    'ecology',
    'visitor',
    'raisin',
    'yelp',
    'says',
    'findings',
    'bulge',
    'rapids',
    'paper',
    'branch',
    'spelling',
    'cubic',
    'tactics',
    'formal',
    'disease',
];

describe('Onboarding - T2 in recovery mode', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.task('startEmu', { version: '2.3.1', wipe: true });
        cy.resetDb();
        cy.viewport(1024, 768);
        cy.prefixedVisit('/');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@firmware/skip-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
    });

    it('Initial run with device that is already in recovery mode', () => {
        // start recovery with some device 
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.task('pressYes');
        cy.wait(501); // wait for device release

        // disconnect device, reload application
        cy.task('stopEmu');
        cy.getTestElement('@connect-device-prompt', { timeout: 20000 });
        cy.wait(501);
        cy.resetDb();
        cy.reload();

        // now suite has reloaded. database is wiped.
        cy.task('startEmu', { version: '2.3.1', wipe: false });
        // recovery device persisted reload
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.wait(1000);
        cy.task('pressNo');
        cy.wait(1000);
        cy.task('pressYes');
    });

    // https://github.com/trezor/trezor-suite/issues/2049
    it(`
        1. start recovery
        2. enter first shamir share
        3. reconnect device
        4. enter second shamir share
        5. recovery is finished
    `, () => {
        
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.task('pressYes');
        cy.wait(1000);
        cy.task('pressYes');
        cy.wait(1000);
        cy.task('selectNumOfWordsEmu', 20);
        cy.wait(1000);
        cy.task('pressYes');
        for (let i = 0; i < shareOneOfThree.length; i++) {
            cy.task('inputEmu', shareOneOfThree[i]);
        }
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.wait(501);
        cy.task('stopEmu');
        cy.wait(1000);
        cy.getTestElement('@connect-device-prompt', { timeout: 30000 });
        cy.task('startEmu', { version: '2.3.1', wipe: false });
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.wait(1000);
        cy.task('pressYes');
        cy.wait(1000);
        cy.task('pressYes');
        cy.wait(1000);
        for (let i = 0; i < shareTwoOfThree.length; i++) {
            cy.task('inputEmu', shareTwoOfThree[i]);
        }
        cy.wait(1000);
        cy.task('pressYes');
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
    });
});
