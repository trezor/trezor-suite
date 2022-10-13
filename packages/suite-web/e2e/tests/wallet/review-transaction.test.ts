// @group:fragile
// @retry=2

describe('Review transaction modal', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });

        cy.task('setupEmu', {
            mnemonic:
                'volcano budget pact suit embody rocket rescue congress orient appear gadget multiply',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    const fixtures = [
        {
            network: 'test',
            address: 'tb1qajr3a3y5uz27lkxrmn7ck8lp22dgytvagr5nqy',
            amount: '0.00001',
            fee: '1',
            confirmationSteps: [
                {
                    element: '@prompts/confirm-on-device/step/0/active',
                    snapshot: {
                        name: 'test-confirm-address',
                    },
                },
            ],
        },
        // ethereum testnet
        {
            network: 'trop',
            address: '0x7de62F23453E9230cC038390901A9A0130105A3c',
            fee: '1',
            amount: '1',
            confirmationSteps: [
                {
                    element: '@prompts/confirm-on-device/step/0/active',
                    snapshot: {
                        name: 'trop-confirm-address',
                    },
                },
            ],
        },
        // ethereum testnet with token
        {
            network: 'trop',
            address: '0x7de62F23453E9230cC038390901A9A0130105A3c',
            token: 'KOMBUCHA',
            fee: '1',
            amount: '1',
            confirmationSteps: [
                {
                    element: '@prompts/confirm-on-device/step/0/active',
                    snapshot: {
                        name: 'trop-token-confirm-address',
                    },
                },
            ],
        },
        // cardano testnet
        {
            network: 'tada',
            address:
                'addr_test1qp4jwf78hftza48x8ajc74ygn47lr0w0hfmsnvzx66sehssj922xhxkn6twlq2wn4q50q352annk3903tj00h45mgfmssfrxrt',
            fee: '44',
            amount: '1',
            confirmationSteps: [
                {
                    element: '@prompts/confirm-on-device',
                    // cardano random fees https://cips.cardano.org/cips/cip2/#randomimprove
                    screenshot: {
                        name: 'tada-confirm-address',
                    },
                },
            ],
        },
        // cardano testnet token
        {
            network: 'tada',
            address:
                'addr_test1qp4jwf78hftza48x8ajc74ygn47lr0w0hfmsnvzx66sehssj922xhxkn6twlq2wn4q50q352annk3903tj00h45mgfmssfrxrt',
            token: 'FINANCEBINARIES',
            fee: '44',
            amount: '1',
            confirmationSteps: [
                {
                    element: '@prompts/confirm-on-device',
                    // cardano random fees https://cips.cardano.org/cips/cip2/#randomimprove
                    screenshot: {
                        name: 'tada-token-confirm-address',
                    },
                },
            ],
        },
    ];

    fixtures.forEach(f => {
        it(`${f.network}${f.token ? `-${f.token}` : ''}: Review transaction modal`, () => {
            cy.discoveryShouldFinish(); // todo: this should't be needed here

            // go to coin settings and enable cardano
            cy.getTestElement('@suite/menu/settings').click();
            cy.getTestElement('@settings/menu/wallet').click();
            cy.getTestElement(`@settings/wallet/network/btc`).click(); // turn off btc

            cy.getTestElement(`@settings/wallet/network/${f.network}`).click();

            // go to account #1
            cy.getTestElement('@suite/menu/suite-index').click();
            cy.getTestElement('@suite/menu/wallet-index').click();
            cy.getTestElement(`@account-menu/${f.network}/normal/0`).click();
            cy.discoveryShouldFinish();

            // go to send form and fill it with data
            cy.getTestElement('@wallet/menu/wallet-send').click();

            if (f.token) {
                // todo: ethereum only
                cy.getTestElement('@amount-select/input').click({ force: true });
                cy.getTestElement('@amount-select/input').type(`${f.token}{enter}`);
            }

            cy.getTestElement('outputs[0].address').type(f.address);
            cy.getTestElement('outputs[0].amount').type(f.amount);
            cy.getTestElement('select-bar/custom').click();
            cy.getTestElement('feePerUnit').clear().type(f.fee);

            // submit form
            cy.getTestElement('@send/review-button').click();
            f.confirmationSteps.forEach(step => {
                cy.getTestElement(step.element);
                // some of the fixtures have changing content so use only screenshot for reference
                if ('screenshot' in step) {
                    cy.getTestElement('@modal').screenshot(step.screenshot.name);
                } else if (step.snapshot) {
                    cy.getTestElement('@modal').matchImageSnapshot(step.snapshot.name);
                }
            });

            // todo: it seems like pressYes can't confirm signing transaction on device?
            // cy.task('pressYes');
            // cy.getTestElement('@prompts/confirm-on-device/step/1/active');
            // cy.getTestElement('@modal').matchImageSnapshot(`${f.network}-confirm-amount`);
            // cy.task('pressYes');
            // cy.getTestElement('@prompts/confirm-on-device/success');
            // cy.getTestElement('@modal').matchImageSnapshot(`${f.network}-confirmed`);
        });
    });
});
