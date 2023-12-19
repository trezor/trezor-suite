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

describe('Onboarding - T2T1 in recovery mode', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.task('startEmu', { wipe: true, version: '2.4.3' });
        cy.resetDb();
        cy.viewport(1080, 1440);
        cy.prefixedVisit('/');
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();

        cy.getTestElement('@firmware/skip-button').click();

        cy.getTestElement('@onboarding/path-recovery-button').click();
    });

    it('Initial run with device that is already in recovery mode', () => {
        // start recovery with some device
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.task('pressYes');
        cy.wait(1000);
        cy.task('pressYes');
        cy.wait(1000);
        cy.task('selectNumOfWordsEmu', 20);
        cy.wait(1000);
        cy.task('pressYes');
        cy.wait(501); // wait for device release

        // disconnect device, reload application
        cy.task('stopEmu');
        cy.getTestElement('@connect-device-prompt', { timeout: 20000 });
        cy.wait(501);
        cy.resetDb();
        cy.reload();

        // now suite has reloaded. database is wiped.
        cy.task('startEmu', { wipe: false, version: '2.4.3' });
        // analytics opt-out again
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();
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
        cy.task('startEmu', { wipe: false, version: '2.4.3' });
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

export {};
