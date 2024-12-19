import { Locator, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

export class WordInputActions {
    readonly wordSelectInput: Locator;

    constructor(private page: Page) {
        this.wordSelectInput = page.getByTestId('@word-input-select/input');
    }

    async inputWord(word: string) {
        await this.wordSelectInput.type(word);
        await this.page.getByTestId(`@word-input-select/option/${word}`).click();
    }

    async inputMnemonicT1B1(mnemonic: string[]) {
        for (let i = 0; i < 24; i++) {
            await this.page.waitForTimeout(400);
            const state = await TrezorUserEnvLink.getDebugState();
            const position = state.recovery_word_pos - 1;
            await this.inputWord(mnemonic[position]);
        }
    }
}
