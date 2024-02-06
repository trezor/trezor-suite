// @group:passphrase
// @retry=2

const testedVersions = ['2-latest', '1-latest'];

describe('Passphrase cancel', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
    });

    testedVersions.forEach(version => {
        it(version, () => {
            cy.task('startEmu', { wipe: true, version });
            cy.task('setupEmu', {
                mnemonic: 'all all all all all all all all all all all all',
                passphrase_protection: true,
            });
            cy.task('startBridge');
            cy.prefixedVisit('/');
            cy.passThroughInitialRun();

            cy.getTestElement('@passphrase/input').type('abc');
            cy.getTestElement('@passphrase/hidden/submit-button').click();
            cy.getTestElement('@suite/modal/confirm-action-on-device');

            cy.getTestElement('@confirm-on-device/close-button').click();
            cy.getTestElement('@toast/auth-failed');
            // todo: interesting fact is that T1B1 and T2T1 have different text in the toast notification
        });
    });
});

export {};
