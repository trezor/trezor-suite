// @group:passphrase
// @retry=2

describe('Passphrase', () => {
    beforeEach(() => {
        // note that versions before 2.3.1 don't have passphrase caching, this means that returning
        // back to passphrase that was used before in the session would require to type the passphrase again
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    // TODO: there is a problem with clearing our password input element -> cypress deletes only last char with {selectAll}{backspace} and totally ignores .clear() command
    it.skip('just test passphrase input', () => {
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.task('pressYes');

        // select whole text and delete it
        cy.getTestElement('@passphrase/input').type('123456');
        cy.getTestElement('@passphrase/input').type('{selectall}');
        cy.getTestElement('@passphrase/input').type('1');
        cy.getTestElement('@passphrase/input').type('{backspace}');
        cy.getTestElement('@passphrase/input').should('have.value', '');

        // leftarrow sets caret to correct position
        cy.getTestElement('@passphrase/input').type('abcdef{leftarrow}{leftarrow}12');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', 'abcd12ef');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').type('{leftarrow}{leftarrow}{backspace}{backspace}');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', 'ab12ef');

        // toggle hidden/visible keeps caret position
        // cy.getTestElement('@passphrase/input').clear();
        cy.getTestElement('@passphrase/input').type('{selectall}');
        cy.getTestElement('@passphrase/input').type('1');
        cy.getTestElement('@passphrase/input').type('{backspace}');
        cy.getTestElement('@passphrase/input').type('123{leftarrow}');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', '12abc3');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').type('{rightarrow}xyz');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', '12abc3xyz');

        // when selectionStart===0 (looking at you nullish coalescing)
        cy.getTestElement('@passphrase/input')
            .clear()
            .type('123{leftarrow}{leftarrow}{leftarrow}abc');
        cy.getTestElement('@passphrase/input').should('have.value', 'abc123');
        cy.getTestElement('@passphrase/input')
            .clear()
            .type('123{leftarrow}{leftarrow}{leftarrow}{backspace}{del}');
        cy.getTestElement('@passphrase/input').should('have.value', '23');

        // todo: make sure that setting caret position via mouse click works as well could not make it, click does not move caret using cypress?
        // cy.getTestElement('@passphrase/input').clear().type('123456');
        // cy.getTestElement('@passphrase/input').trigger('click', 40, 25);

        // todo: select part of test + copy/paste
    });
});

export {};
