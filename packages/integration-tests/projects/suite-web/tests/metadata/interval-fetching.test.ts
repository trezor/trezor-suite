// @stable

import * as METADATA from '../../../../../suite/src/actions/suite/constants/metadataConstants';
import { stubFetch, stubOpen } from '../../stubs/metadata';

describe.skip('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        suite is watching cloud provider and syncs periodically
    `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startGoogle');
        cy.clock();

        cy.prefixedVisit('/accounts', {
            onBeforeLoad: win => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', stubFetch);
            },
        });
        cy.tick(1000);

        cy.passThroughInitialRun();
        cy.log(
            'Wait for discovery to finish. There is "add label" button, but no actual metadata appeared',
        );
        // todo: better waiting for discovery (mock it!)
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        cy.passThroughInitMetadata();

        cy.log('Already existing label gets loaded');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'label');

        // this simulates entering label in another window
        cy.task('setupGoogle', {
            prop: 'files',
            value: [
                {
                    id: '13DH0FwzmGHmf2sWRBIvyJ9WJlkKTgL-KKamv-oqw6fvKqcQYGA',
                    name: 'f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
                    data:
                        '1d6645c3d09df834814f7cbdfe5fa8502adb613d23c4cc8162a4587d55580866df66029ce02aeaec495271316e3791e54fce4335102f1528165c08f3a4f5160398a6a1435281da3c69ef74ff2f725679a1be64923c58f3b388d22d93787bc0c8d457c566f49f990f31f1a5b2043432e9439bb941c7adad2673964ab51e89bd9531a2edfefe6669a84d49d3c71380bfd7be34931c8b9296e23c3624aa1f38a2e3e91a6a94af456080f78c92b96a277e5ed31c0a8e64a724da125b5facf556959189a03baf1e24d0e4a326d8df6e8f2328fca0bf7364f17ffbc68a212fda6ab655085109ca2f5f79e2587a00d74350ecc64adb7f5f29d27a1fb08b9d7f526be084ecc12b166a1f148c233598d03569a834723ddf935fb1ab9e117bcce418bf57e7fdd7ad2201197f9012421728cabefa0b32ffe63fc1bd674fbe622573ca5c1360113cfac2603c02eb73417d3bc4a5964da9d3849524e3545225e6be0eee6b8b993d8a33cb17c426395c336bd034199fb040e548a5063d767092363dac98a5e5d34c9ec77ba730a037bf5947990adc10f7266f58f8318583aa067efe9ed3eadbdb532cc914d470cc3b2b504aca395cfe9bf042e4d55594cd19b685c401ab180a36d44a7e9f6b21971a0d7fa79c821a65f668f94905ece3c0455ab5be3d1efe44d30c6be7650c0c2de0cd6cdc4580bce3379fb57bb45cef6da1316344d7d0b78c1c70c058d08cb5bc537be89b72234a8cbc267cd34d5b6dbe45a43ab5ef8eee017504075cb2f4b771bbe1861bf5854c62dd4b98cb1674a7a41682',
                    mimeType: 'text/plain',
                    kind: 'drive#file',
                },
            ],
        });

        // and this does the time travel to trigger fetch
        cy.tick(METADATA.FETCH_INTERVAL);
        cy.getTestElement('@metadata/outputLabel/33T7ExFCVnK2TiQhz73JiXiNLHFmo9JqN2').should('contain', 'label from another window');

        cy.log('Go to settings and lets see what happens if user wipes his data from google drive interface (out of suite)');
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata/disconnect-provider-button');
        cy.log('Next command simulates that user wiped his google drive');
        cy.task('setupGoogle', { prop: 'files', value: []});
        cy.tick(METADATA.FETCH_INTERVAL);
        cy.getTestElement('@settings/metadata/connect-provider-button');

        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
    });
});
