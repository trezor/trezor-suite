// @group_passphrase
// @retry=2
import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';
const defAddr = 'bc1qek0hazgrelpuce8anp72ur4kpgel74ype3pw52';

describe('Passphrase', () => {
    beforeEach(() => {
        // note that versions before 2.3.1 don't have passphrase caching, this means that returning
        // back to passphrase that was used before in the session would require to type the passphrase again
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();

        requests = [];
    });

    it('add 1st hidden wallet (abc) -> fail to confirm passphrase -> try again from notification, succeed -> check 1st address -> switch to 2nd hidden wallet (def) -> check 1st address -> go back to 1st hidden wallet -> check confirm passphrase appears. ', () => {
        cy.log('passphrase abc for the first time');
        // add 1st hidden wallet
        cy.getTestElement('@menu/switch-device').click();

        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.task('pressYes');
        // first input
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');
        cy.getTestElement('@passphrase-confirmation/step1-open-unused-wallet-button', {
            timeout: 20_000,
        }).click();
        cy.getTestElement('@passphrase-confirmation/step2-button').click();

        // confirm - input wrong passphrase
        cy.getTestElement('@passphrase/input').type('cba');

        cy.task('pressYes');
        cy.task('pressYes');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        // retry
        cy.getTestElement('@passphrase-mismatch/start-over').click();
        // confirm again - input correct this time
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');
        cy.getTestElement('@passphrase-confirmation/step1-open-unused-wallet-button', {
            timeout: 20_000,
        }).click();
        cy.getTestElement('@passphrase-confirmation/step2-button').click();
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@dashboard/loading').should('not.exist');

        cy.interceptDataTrezorIo(requests);

        // go to wallet
        cy.getTestElement('@account-menu/btc/normal/0').click();
        // go to receive
        cy.getTestElement('@wallet/menu/wallet-receive').click({ timeout: 10000 });
        // click reveal address
        cy.getTestElement('@wallet/receive/reveal-address-button').click();
        cy.getTestElement('@device-display/chunked-text')
            .find('[data-testid*="chunk"]')
            .then(chunks => {
                let fullAddress = '';
                // @ts-expect-error
                chunks.each((i, el) => {
                    fullAddress += Cypress.$(el).text();
                });

                return fullAddress;
            })
            .should('contain', abcAddr);
        cy.task('pressYes');
        cy.getTestElement('@metadata/copy-address-button')
            .should('exist')
            .should('not.be.disabled');
        // close modal
        cy.getTestElement('@modal/close-button').click();

        cy.log('passphrase def');
        // add 2nd hidden wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.addHiddenWallet('def');

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SelectWalletType>>(
            requests,
            EventType.SelectWalletType,
        ).then(selectWalletTypeEvent => {
            expect(selectWalletTypeEvent.type).to.equal('hidden');
        });

        // go to receive
        cy.wait(1000);
        cy.getTestElement('@wallet/menu/wallet-receive').click({ timeout: 10000 });
        // click reveal address
        // no address should be in table yet
        cy.getTestElement('@wallet/receive/used-address/0').should('not.exist');
        cy.getTestElement('@wallet/receive/reveal-address-button').should('not.be.disabled');
        cy.getTestElement('@wallet/receive/reveal-address-button').click();
        cy.getTestElement('@device-display/chunked-text')
            .find('[data-testid*="chunk"]')
            .then(chunks => {
                let fullAddress = '';
                // @ts-expect-error
                chunks.each((i, el) => {
                    fullAddress += Cypress.$(el).text();
                });

                return fullAddress;
            })
            .should('contain', defAddr);
        cy.task('pressYes');
        cy.getTestElement('@metadata/copy-address-button')
            .should('exist')
            .should('not.be.disabled');
        // close modal
        cy.getTestElement('@modal/close-button').click();

        cy.log('passphrase abc again. now it is cached in device');
        // now go back to the 1st wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/1').click();
        // go to receive
        cy.wait(1000);
        cy.getTestElement('@wallet/menu/wallet-receive').click({ timeout: 10000 });
        // reveal 0 address again
        // no address should be in table yet
        cy.getTestElement('@wallet/receive/used-address/0').should('not.exist');
        cy.getTestElement('@wallet/receive/reveal-address-button').should('not.be.disabled');
        cy.getTestElement('@wallet/receive/reveal-address-button').click();

        // should display confirm passphrase modal
        cy.getTestElement('@device-display/chunked-text')
            .find('[data-testid*="chunk"]')
            .then(chunks => {
                let fullAddress = '';
                // @ts-expect-error
                chunks.each((i, el) => {
                    fullAddress += Cypress.$(el).text();
                });

                return fullAddress;
            })
            .should('contain', abcAddr);
        cy.task('pressYes');
    });
});

export {};
