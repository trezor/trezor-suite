// @group:firmware-update
// @retry=2

import har from '../../fixtures/fw-update-on-bl-2.0.3-to-fw-2.5.1';

let firmwareHash = '';

// This file is the first test with bridge communication mocked.
// We need this because we:
// 1. don't have all possible versions emulators and we still need to support older versions
// 2. even if we had all possible versions it would not work since they are not supported by trezorlib anymore
// 3. we don't have emulator support for bootloader

// Tests to be written:
// - [x] fw update from empty device bootloader 2.0.3 to firmware 2.5.1
// - [] fw update T1B1 with intermediary
// - [] fw update T2T1 incremental update over 2.0.5
// - [] fw update with fingerprint
// - [] fw update failures, various cases
// - [] fw update with evil device (getFirmwareHash)

// HOW TO:
// - Have devtools opened -> network
// - Go to suite, do the same things you intend to do in your test
// - After your are done, right click "Save all as HAR with content"
// - Save it into path packages/suite-web/e2e/fixtures/<name>.har
// - run `yarn tsx packages/suite-web/e2e process-har.ts <name>.hare`
// - where you would normally do `cy.task('startBridge') run  `cy.task('startMockedBridge, har)` instead  where har is the output of process-har.ts script
// - profit

describe('fw update from empty device bootloader 2.0.3 to firmware 2.5.1', () => {
    beforeEach(() => {
        cy.task('startMockedBridge', har);

        // make sure that we always upgrade to version 2.5.1
        cy.intercept('*', { pathname: '/static/connect/data/firmware/t2t1/releases.json' }, [
            {
                required: false,
                version: [2, 5, 1],
                min_bridge_version: [2, 0, 7],
                min_firmware_version: [2, 0, 8],
                min_bootloader_version: [2, 0, 0],
                url: 'firmware/t2t1/trezor-t2t1-2.5.1.bin',
                url_bitcoinonly: 'firmware/t2t1/trezor-t2t1-2.5.1-bitcoinonly.bin',
                fingerprint: '782d4934897018cac779eebb0d7c66e21da7789b9cd35e1f99f097bdfd9b7d33',
                fingerprint_bitcoinonly:
                    'db5d7b211532f717a32fe0b1bd3e3df6ad5464079a896a7f7492ab6e9e030bb5',
                notes: 'https://blog.trezor.io/trezor-suite-and-firmware-updates-may-2022-b1af60742291',
                changelog:
                    '* Support Electrum signatures in VerifyMessage.\n* Support Cardano Alonzo-era transactions (Plutus).\n* Bitcoin bech32 addresses QR codes have bigger pixels which are easier to scan.\n* EIP-1559 transaction correctly show final Hold to Confirm screen.\n* Trezor will refuse to sign UTXOs that do not match the provided derivation path (e.g., transactions belonging to a different wallet, or synthetic transaction inputs).\n* Zcash v5 transaction format.',
            },
        ]);

        // make sure that 2.5.1 does not return 404
        cy.intercept(
            '*',
            { pathname: '/static/connect/data/firmware/t2t1/trezor-t2t1-2.5.1.bin' },
            // seems like response does not matter. I thought there was firmware validation but it is probably
            // only in place for custom firmware?
            'foo-bar',
        );

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
    });

    it('firmware update error', () => {
        cy.getTestElement('@analytics/continue-button').click();

        // hook into redux actions to bypass firmware hash check
        cy.window().its('store').should('exist');
        cy.window().then(window => {
            window.store.subscribe(() => {
                // watch for action that updates firmwareHash. this action is triggered after TrezorConnect.firmwareUpdate
                // call is resolved and before TrezorConnect.getFirmwareHash is called.
                // we save firmwareHash computed for the firmware binary that was installed and use it to mock
                // the subsequent TrezorConnect.getFirmwareHash call to return the very same response
                if (window.store.getState().firmware.firmwareHash && !firmwareHash) {
                    firmwareHash = window.store.getState().firmware.firmwareHash!;
                    cy.stub(window.TrezorConnect, 'getFirmwareHash').returns(
                        new Promise(resolve =>
                            resolve({
                                success: true,
                                payload: {
                                    hash: firmwareHash,
                                },
                            }),
                        ),
                    );
                }
            });
        });

        cy.getTestElement('@analytics/continue-button').click();

        cy.getTestElement('@firmware/install-button').click();

        cy.getTestElement('@firmware/continue-button', {
            // longer timeout /listen needs to resolve
            timeout: 60000,
        }).click();
    });
});

export {};
