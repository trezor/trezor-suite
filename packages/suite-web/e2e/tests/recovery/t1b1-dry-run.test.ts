// @group_device-management

import { SeedCheckType } from '../../support/enums/seedCheckType';
import { onCheckSeedPage } from '../../support/pageObjects/checkSeedObject';
import { onSettingsDevicePage } from '../../support/pageObjects/settings/settingsDeviceObject';
import { onSettingsMenu } from '../../support/pageObjects/settings/settingsMenuObject';
import { onNavBar } from '../../support/pageObjects/topBarObject';
import { onWordInputPage } from '../../support/pageObjects/wordInputObject';

const mnemonic = [
    'nasty',
    'answer',
    'gentle',
    'inform',
    'unaware',
    'abandon',
    'regret',
    'supreme',
    'dragon',
    'gravity',
    'behind',
    'lava',
    'dose',
    'pilot',
    'garden',
    'into',
    'dynamic',
    'outer',
    'hard',
    'speed',
    'luxury',
    'run',
    'truly',
    'armed',
];

function confirmSuccessOnDevice(): void {
    cy.task('pressYes');
}

describe('Recovery T1B1 - dry run', () => {
    const pin = '1';
    beforeEach(() => {
        cy.task('startEmu', { model: 'T1B1', version: '1-latest', wipe: true });
        cy.wait(2000);
        cy.task('setupEmu', { needs_backup: false, mnemonic: mnemonic.join(' '), pin });
        cy.task('startBridge');
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        onNavBar.openSettings();
        onSettingsMenu.openDeviceSettings();
    });

    it('Standard dry run', () => {
        onSettingsDevicePage.openSeedCheck();
        onCheckSeedPage.initCheck(SeedCheckType.Standard, 24);
        cy.enterPinOnBlindMatrix(pin);
        onWordInputPage.inputMnemonicT1B1(mnemonic);

        confirmSuccessOnDevice();

        onCheckSeedPage.verifyCheckSuccessful();
    });
});
