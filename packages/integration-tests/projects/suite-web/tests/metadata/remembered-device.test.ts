// @stable/metadata
// @retry=2

// todo: find out why it has become flaky
// it works on local well but fails in CI

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

describe.skip('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopDropbox');
    });

    it(`
        In settings, there is enable metadata switch. On enable, it initiates metadata right away (if device already has state).
        On disable, it throws away all metadata related records from memory.
    `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startDropbox');
        cy.task('setFileContent', {
            provider: 'dropbox',
            file:
                '/apps/trezor/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            content: {
                version: '1.0.0',
                accountLabel: 'already existing label',
                outputLabels: {},
                addressLabels: {},
            },
            aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
        });

        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', rerouteDropbox);
            },
        });

        cy.passThroughInitialRun();

        cy.log(
            'Wait for discovery to finish. There is "add label" button, but no actual metadata appeared',
        );
        // todo: better waiting for discovery (mock it!)
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

        cy.log('Go to settings and enable metadata');
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.passThroughInitMetadata('dropbox');

        cy.log('Now metadata is enabled, go to accounts and see what we got loaded from provider');
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'already existing label',
        );

        // device not saved, disconnect provider
        cy.log(
            "Now go back to settings, disconnect provider and check that we don't see metadata in app",
        );
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata/disconnect-provider-button').click();
        cy.getTestElement('@settings/metadata/connect-provider-button');
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'not.contain',
            'already existing label',
        );

        cy.log(
            'At this moment, there are no labels. But we still can see "add label" button, which inits metadata flow but without obtaining keys from device (they are saved!)',
        );
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        cy.getTestElement('@modal/metadata-provider/dropbox-button').click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'already existing label',
        );

        // device not saved, disable metadata
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('not.contain', 'label');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        cy.log(
            'disabling metadata removed also all keys, so metadata init flow takes all steps now',
        );
        cy.passThroughInitMetadata('dropbox');

        // device saved, disconnect provider
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-instance/toggle-remember-switch').click({
            force: true,
        });
        cy.getTestElement('@switch-device/wallet-instance').click();
        cy.task('stopEmu');

        cy.log('Device is saved, when disconnected, user still can edit labels');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });
        cy.getTestElement('@metadata/input').type(' edited for remembered{enter}');

        cy.log('Now again, lets try disconnecting provider');
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata/disconnect-provider-button').click();
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

        cy.log('Still possible to reconnect provider, we have keys still saved');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        cy.getTestElement('@modal/metadata-provider/dropbox-button').click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');
        cy.getTestElement('@metadata/input').type('mnau{enter}');

        //  device saved, disable metadata
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.log('Now it is not possible to add labels, keys are gone and device is not connected');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").should(
            'not.exist',
        );
    });
});
