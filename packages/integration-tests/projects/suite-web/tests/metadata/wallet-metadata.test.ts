// @stable/metadata

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    after(() => {
        cy.task('stopDropbox');
    });

    it('Wallet labeling', () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startDropbox');

        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', rerouteDropbox);
            },
        });

        cy.passThroughInitialRun();

        // todo: better waiting for discovery (mock it!)
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );

        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@metadata/walletLabel/standard-wallet/add-label-button').click({
            force: true,
        });
        cy.passThroughInitMetadata('dropbox');

        cy.getTestElement('@metadata/input').type('label for standard wallet{enter}');
        cy.getTestElement('@metadata/walletLabel/standard-wallet/renamed-label-button').should(
            'not.be.visible',
        );
        cy.getTestElement('@metadata/walletLabel/standard-wallet/edit-label-button').click({
            force: true,
        });
        cy.getTestElement('@metadata/input').clear().type('wallet for drugs{enter}');

        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.getTestElement('@passphrase/input', { timeout: 30000 }).type('abc');

        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.getTestElement('@suite/loading').should('not.be.visible');

        cy.log('discovering new passphrase -> new deviceState -> we need new metadata master key');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@metadata/walletLabel/standard-wallet').should(
            'contain',
            'wallet for drugs',
        );

        // focus lock? :(
        cy.getTestElement('@metadata/walletLabel/hidden-wallet-1/add-label-button').click({
            force: true,
        });
        cy.getTestElement('@metadata/input').type('wallet not for drugs{enter}');
        cy.getTestElement('@metadata/walletLabel/hidden-wallet-1').should(
            'contain',
            'wallet not for drugs',
        );

        cy.window()
            .its('store')
            .invoke('getState')
            .then(state => {
                console.log(state);
                const errors = state.notifications.filter(n => n.type === 'error');
                expect(errors).to.be.empty;
            });
    });
});
