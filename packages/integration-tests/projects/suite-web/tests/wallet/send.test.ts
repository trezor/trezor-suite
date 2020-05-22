const validBech32Addr = 'bc1q5f2lvs7t29wv8nwssse6a4f6099sc3nagchqyc';

const account = {
  "deviceState": "mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@355C817510C0EABF2F147145:undefined",
  "index": 2,
  "path": "m/49'/0'/0'",
  "descriptor": "ypub6X3zZL7MrQTh9xJT8k85eTqN4ejhycmry8etrsZVszWwEPMFiPY2rjA7oqqMEC45nE6FXfaKXo56Sd5tuFZmU2EZY6Ns6igHCivL7Wo727V",
  "accountType": "segwit",
  "symbol": "btc",
  "empty": false,
  "visible": true,
  "balance": "500001",
  "availableBalance": "497997",
  "formattedBalance": "0.00500001",
  "tokens": [],
  "addresses": {
    "change": [
      {
        "address": "38c7MWgUYDpoj9jM1LXhBDXoTTgB9qXNCP",
        "path": "m/49'/0'/0'/1/0",
        "transfers": 0
      },
    ],
    "used": [
      {
        "address": "3FJFWzgkqZjREN5HDWqLTU6eMtz9GzN5v7",
        "path": "m/49'/0'/0'/0/0",
        "transfers": 1,
        "balance": "500001",
        "sent": "0",
        "received": "500001"
      }
    ],
    "unused": []
  },
  "utxo": [
    {
      "txid": "a5454cad3bafe8cb385004fa11c0db80de8663023c18a745b45b893cf366eab9",
      "vout": 1,
      "amount": "436031",
      "address": "38c7MWgUYDpoj9jM1LXhBDXoTTgB9qXNCP",
      "path": "m/49'/0'/0'/1/0",
      "confirmations": 0
    },
    {
      "txid": "7811d59767fe6c5258db4771cc808fc6b67db1a464f97fc5b4b61885662a56b2",
      "vout": 0,
      "amount": "10333",
      "address": "3H9fG3BVUMc9WDzVHoAgfkJjFjds3a7Y6j",
      "path": "m/49'/0'/0'/0/3",
      "confirmations": 0
    },
    {
      "txid": "edf716436c52db594046b61d7716af274007147b800f593cba9b923140e997ea",
      "vout": 0,
      "amount": "10322",
      "address": "3LGLP8MBDCfmtF46D1DzNYKKdWDxzoRMxq",
      "path": "m/49'/0'/0'/0/2",
      "confirmations": 0
    },
    {
      "txid": "a5454cad3bafe8cb385004fa11c0db80de8663023c18a745b45b893cf366eab9",
      "vout": 0,
      "amount": "10614",
      "address": "3LGLP8MBDCfmtF46D1DzNYKKdWDxzoRMxq",
      "path": "m/49'/0'/0'/0/2",
      "confirmations": 0
    },
    {
      "txid": "f154d8fa4684ce2ebc787c1f648136a3795fd20eed630710a6179ea5e26416d3",
      "vout": 0,
      "amount": "10214",
      "address": "33h2RRNv2Jhgv8zjNfnpRXhYpE7mowPwca",
      "path": "m/49'/0'/0'/0/1",
      "confirmations": 0
    },
    {
      "txid": "e03cadcb4e4ae8e3c2b039935e7deeb7856846e7a9612ea658c6a9d883572137",
      "vout": 0,
      "amount": "10235",
      "address": "33h2RRNv2Jhgv8zjNfnpRXhYpE7mowPwca",
      "path": "m/49'/0'/0'/0/1",
      "confirmations": 0
    },
    {
      "txid": "fa87d22cbe38df6dd30c0a72ad14185344a71a877a160b6254d6c656e0a8fde8",
      "vout": 0,
      "amount": "10248",
      "address": "33h2RRNv2Jhgv8zjNfnpRXhYpE7mowPwca",
      "path": "m/49'/0'/0'/0/1",
      "confirmations": 0
    }
  ],
  "history": {
    "total": 1,
    "unconfirmed": 6
  },
  "networkType": "bitcoin",
  "page": {
    "index": 1,
    "size": 25,
    "total": 1
  }
};

describe('Send form', () => {
    beforeEach(() => {
        cy.viewport(1224, 768).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.visit('/wallet/send#/btc/2/segwit');
        cy.passThroughInitialRun();

        // feed account with real utxo
        cy
          .window()
          .its('store')
          .invoke('dispatch', {
              type: '@account/create',
              payload: account,
          });

        // wait until discovery is completed
        cy.window().its('store').invoke('getState').should((store) => {
            expect(store.wallet.discovery[0].status).to.equal(4);
        })
        
        // fake finish discovery (there is one added account extra causes discovery to appear uninished otherwise)
        cy
          .window()
          .its('store')
          .invoke('dispatch', {
              type: '@discovery/complete',
              payload: {},
          });
    });

    // at the moment, amount does not change when clicking send max while address is invalid
    it('invalid address should not block set send max', () => {
        cy.getTestElement('@send/output-0/address-input').type('invalidish');
        cy.getTestElement('@send/output-0/enable-send-max-button').click();
        cy.getTestElement('@send/output-0/amount-input', { timeout: 4000 }).should(($el) => {
          const amount = $el.val();
          if (typeof amount !== 'string') {
            throw new Error('expected amount to be string');
          }
          expect(Number.parseFloat(amount)).to.be.closeTo(0.004, 0.002);
        });
      });

    // at the moment, fiat changes format from decimal to exponential, is it what we want?
    it('fiat recalculation', () => {
        cy.getTestElement('@send/output-0/amount-input').type('0.00000001');
        cy.getTestElement('@send/fiat-select/input').click({ force: true});
        cy.getTestElement('@send/fiat-select/option/czk').click({ force: true });

        cy.getTestElement('@send/output-0/amount-input', { timeout: 4000 }).should('not.have.value', '1e-8');
    });

    // ok
    it('clear form', () => {
      cy.getTestElement('@send/output-0/enable-send-max-button').click();
      cy.getTestElement('@send/output-0/amount-input', { timeout: 4000 }).should(($el) => {
        const amount = $el.val();
        if (typeof amount !== 'string') {
          throw new Error('expected amount to be string');
        }
        expect(Number.parseFloat(amount)).to.be.closeTo(0.004, 0.002);
      });
      
      cy.getTestElement('@send/add-select/input').click();
      cy.getTestElement('@send/add-select/option/RECIPIENT').click();
      
      cy.getTestElement('@send/add-select/input').click();
      cy.getTestElement('@send/add-select/option/RECIPIENT').click();
      
      cy.getTestElement('@send/output-1/amount-input').should('have.value', '');
      cy.getTestElement('@send/output-2/amount-input').should('have.value', '');

      cy.getTestElement('@send/output-2/clear-button').click();
      cy.getTestElement('@send/output-2/amount-input').should('not.exist');

      cy.getTestElement('@send/clear-all-button').click();
      cy.getTestElement('@send/output-1/amount-input').should('not.exist');
      cy.getTestElement('@send/output-2/amount-input').should('not.exist');
      cy.getTestElement('@send/output-0/address-input').should('have.value', '');
      cy.getTestElement('@send/output-0/amount-input').should('have.value', '');
    })

    // partially ok, but when going up with fee level at the end, not enough funds appears
    it('send max - should always recalculate according to selected fee level and never show "not enough funds"', () => {
      cy.log('toggle send max and check value of default fee level');
      cy.getTestElement('@send/advanced-toggle').click();
      cy.getTestElement('@send/output-0/enable-send-max-button').click();
      cy.getTestElement('@send/output-0/amount-input').should('not.have.value', '0');
      cy.get('body').should('not.contain', 'Not enough funds')
      
      cy.log('set fee level to low and check that amount increased');
      cy.getTestElement('@send/fee-select/input').click();
      cy.getTestElement('@send/fee-select/option/low').click();
      cy.getTestElement('@send/output-0/amount-input').should('not.have.value', '0');
      cy.get('body').should('not.contain', 'Not enough funds')

      cy.log('set fee level to low and check that amount decreased, also not enough funds should not appear');
      cy.getTestElement('@send/fee-select/input').click({ force: true });
      cy.getTestElement('@send/fee-select/option/high').click({ force: true });
      cy.getTestElement('@send/output-0/amount-input').should('not.have.value', '0');
      cy.wait(100);
      cy.get('body', { timeout: 1000}).should('not.contain', 'Not enough funds')
    });

    // mytrezor has it like this and it seems reasonable
    it('send max - focus into amount input should reset set max', () => {
      cy.getTestElement('@send/output-0/enable-send-max-button').click();
      cy.getTestElement('@send/output-0/disable-send-max-button');
      cy.getTestElement('@send/output-0/amount-input').focus();
      cy.log('now enable button should appear again');
      cy.getTestElement('@send/output-0/enable-send-max-button', { timeout: 1000 });
    })

    // mytrezor has it like this and it seems reasonable
    it('send max - focus into fiat input should reset set max', () => {
      cy.getTestElement('@send/output-0/enable-send-max-button').click();
      cy.getTestElement('@send/output-0/disable-send-max-button');
      cy.getTestElement('@send/output-0/fiat-input').focus();
      cy.log('now enable button should appear again');
      cy.getTestElement('@send/output-0/enable-send-max-button', { timeout: 1000 });
    })

    // probably race condition in revalidation upon input
    it('address - should validate correctly', () => {
      cy.getTestElement('@send/output-0/address-input').type(validBech32Addr[0]);
      cy.get('body', { timeout: 1000 }).should('contain', 'Address is not valid');
      
      // note for debugging: validation really fails if you type address letters in quick succession
      // reproducible on localhost as well, just type in two last letters quickly, address is valid
      // but form remains in error state
      cy.getTestElement('@send/output-0/address-input').type(validBech32Addr.substr(1));
      cy.get('body').should('contain', 'Account #1');
    });

    it('send form happy path', () => {
      // check here, longer delays between single key presses and validation works as expected
      cy.getTestElement('@send/output-0/address-input').type(validBech32Addr, { delay: 70 });
      cy.get('body').should('contain', 'Account #1');
      cy.getTestElement('@send/output-0/enable-send-max-button').click();
      cy.getTestElement('@send/review-button').click();
    })


    // note: this probably also makes tests flaky as send for may reset as result of unexpected reconnect
    it.skip('form should not reset on blockchain reconnect', () => {});
    it.skip('form should not reset on device reconnect', () => {});

});

