/// <reference types="cypress" />

class WordInputPage {
    inputWord(word: string) {
        cy.getTestElement('@word-input-select/input').type(word);
        cy.getTestElement(`@word-input-select/option/${word}`).click();
    }

    inputMnemonicT1B1(mnemonic: string[]) {
        cy.step('Input mnemonic', () => {
            for (let i = 0; i < 24; i++) {
                cy.task('getDebugState').then(state => {
                    // @ts-expect-error
                    const position = state.recovery_word_pos - 1;
                    this.inputWord(mnemonic[position]);
                });

                cy.wait(500);
            }
        });
    }
}

export const onWordInputPage = new WordInputPage();
