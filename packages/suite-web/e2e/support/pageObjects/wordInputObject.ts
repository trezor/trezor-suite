/// <reference types="cypress" />

class WordInputPage {
    inputWord(word: string) {
        cy.getTestElement('@word-input-select/input').type(word);
        cy.getTestElement(`@word-input-select/option/${word}`).click();
    }
}

export const onWordInputPage = new WordInputPage();
