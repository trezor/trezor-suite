// @group:onboarding
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
    });

    // cypress open todo
    it('Success (no shamir capability)', () => {
        cy.task('startEmu', { wipe: true, version: '2.1.1' });

        cy.getTestElement('@analytics/consent').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').matchImageSnapshot('1-onboarding-create-wallet');
        cy.getTestElement('@onboarding/continue-button').click();

        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').matchImageSnapshot('2-onboarding-create-wallet');
        cy.getTestElement('@onboarding/continue-button').click();

        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');

        cy.getTestElement('@onboarding-layout/body').matchImageSnapshot(
            '3-onboarding-create-wallet',
            {
                blackout: ['[data-test="@firmware/offer-version/new"]'],
            },
        );
        // todo: hover and make screenshot of "firmware tooltip"
        // for some reason hoverTestElement does not work here
        // cy.hoverTestElement('@firmware/offer-version/new');
        cy.getTestElement('@firmware/skip-button').click();

        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.getTestElement('@onboarding-layout/body').matchImageSnapshot(
            '4-onboarding-create-wallet',
        );
        cy.getTestElement('@onboarding/path-create-button').click();

        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.getTestElement('@onboarding-layout/body').matchImageSnapshot(
            '5-onboarding-create-wallet',
        );
        cy.log('Performing standard backup');
        cy.getTestElement('@onboarding/only-backup-option-button').click();

        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.getTestElement('@prompts/confirm-on-device');
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.getTestElement('@onboarding-layout/body').matchImageSnapshot(
            '6-onboarding-create-wallet',
        );
        cy.task('pressYes');
        cy.getTestElement('@onboarding/create-backup-button').click();

        cy.passThroughBackup();

        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.getTestElement('@onboarding-layout/body').matchImageSnapshot(
            '7-onboarding-create-wallet',
        );
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.getTestElement('@prompts/confirm-on-device');
        cy.getTestElement('@onboarding-layout/body').matchImageSnapshot(
            '8-onboarding-create-wallet',
        );
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.task('pressYes');
        cy.task('inputEmu', '1');
        cy.task('inputEmu', '1');
    });

    // cypress open todo: re-enable
    it.skip('Success (Shamir backup)', () => {
        cy.task('startEmu', { wipe: true });
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@firmware/skip-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();

        cy.log('Will be clicking on Shamir backup button');
        cy.getTestElement('@onboarding/shamir-backup-option-button').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/create-backup-button').click();

        const shares = 3;
        const threshold = 2;
        cy.passThroughBackupShamir(shares, threshold);
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@onboarding/confirm-on-device');

        cy.task('pressYes');
        cy.task('inputEmu', '12');
        cy.task('inputEmu', '12');
    });
});
