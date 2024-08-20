// @group_passphrase
// @retry=2

const testedVersions = [
    // Todo: fix latest version to return proper revision hash (it reports possibly FAKE device now)
    { version: '2-latest', model: 'T2T1' },
    { version: '1.11.2', model: 'T1B1' },
];

describe('Passphrase cancel', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
    });

    testedVersions.forEach(version => {
        it(version.model + '_' + version.version, () => {
            cy.task('startEmu', { wipe: true, ...version });
            cy.task('setupEmu', {
                mnemonic: 'all all all all all all all all all all all all',
                passphrase_protection: true,
            });
            cy.task('startBridge');
            cy.prefixedVisit('/');
            cy.passThroughInitialRun();
            cy.discoveryShouldFinish();

            cy.getTestElement('@menu/switch-device').click();
            cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
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
