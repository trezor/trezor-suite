// @group:wallet
// @retry=2

import { NetworkSymbol } from '@suite-common/wallet-config';
import { onAccountsPage } from '../../support/pageObjects/accountsObject';
import { onSettingsCryptoPage } from '../../support/pageObjects/settingsCryptoObject';

const downloadsFolder = Cypress.config('downloadsFolder');
const coins: NetworkSymbol[] = ['btc', 'ltc', 'eth', 'ada'];

describe('Export transactions', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.discoveryShouldFinish();
    });

    afterEach(() => {
        cy.task('rmDir', { dir: downloadsFolder, recursive: true, force: true });
    });

    /* Test case
     * 1. Start in Coin section
     * 2. Activate all tested coins
     * 3. Pass discovery
     * 4. Navigate to First accounts Wallet
     * 5. Download transaction history in all 3 formats
     * 6. Check that 3 files were downloaded successfully
     * 7. Repeat for all tested coins
     */
    it('Go to account and try to export all possible variants (pdf, csv, json)', () => {
        cy.prefixedVisit('/settings/coins');
        coins.forEach((coin: NetworkSymbol) => {
            if (coin !== 'btc') {
                onSettingsCryptoPage.activateCoin(coin);
            }
        });
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();

        coins.forEach((coin: NetworkSymbol) => {
            onAccountsPage.clickOnDesiredAccount(coin);
            cy.task('rmDir', { dir: downloadsFolder, recursive: true, force: true });
            const typesOfExport: Array<string> = ['pdf', 'csv', 'json'];

            typesOfExport.forEach((type: string) => {
                onAccountsPage.exportDesiredTransactionType(type);

                // Todo: Tweak or delete if test is still failing here.
                //
                // Hope this helps, my suspicion is, that the event of downloaded
                // file closes the dropdown. But it is a blind guess. From video it
                // is hard to tell.
                //
                // Locally, the test always passed.
                cy.wait(2000);
            });

            // assert that downloads folder contains 3 files
            cy.wait(1000);
            cy.task('readDir', downloadsFolder).then(dir => {
                cy.wrap(dir).should('have.length.at.least', 3);
            });
        });
    });
});

export {};
