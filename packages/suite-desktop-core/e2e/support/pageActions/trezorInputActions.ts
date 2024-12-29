import { Locator, Page, test } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { expect } from '../customMatchers';
import { step } from '../common';

export class TrezorInputActions {
    readonly wordSelectInput: Locator;
    readonly pinSubmitButton: Locator;
    readonly pinInput = (index: number) => this.page.getByTestId(`@pin/input/${index}`);

    constructor(private page: Page) {
        this.wordSelectInput = page.getByTestId('@word-input-select/input');
        this.pinSubmitButton = this.page.getByTestId('@pin/submit-button');
    }

    @step()
    async inputWord(word: string) {
        await this.wordSelectInput.type(word);
        await this.page.getByTestId(`@word-input-select/option/${word}`).click();
    }

    @step()
    async inputMnemonicT1B1(mnemonic: string) {
        const arrayMnemonic = mnemonic.split(' ');
        await test.step(`Inputting words ${arrayMnemonic.length}x ${arrayMnemonic}`, async () => {
            for (let i = 0; i < 24; i++) {
                await expect(this.wordSelectInput).toHaveText("Check your Trezor's screen");
                const state = await TrezorUserEnvLink.getDebugState();
                const position = state.recovery_word_pos - 1;
                const isGivenFakeWord = position === -1;
                if (isGivenFakeWord) {
                    await test.step(`Inputting fake word ${state.recovery_fake_word}`, async () => {
                        await this.inputWord(state.recovery_fake_word);
                    });
                } else {
                    await test.step(`Inputting word ${arrayMnemonic[position]} at position ${position}`, async () => {
                        await this.inputWord(arrayMnemonic[position]);
                    });
                }
            }
        });
    }

    //TODO: #16107 Not working with anything else than 12x 'all' - I will ask around
    @step()
    async inputMnemonicT2T1(mnemonic: string) {
        for (const word of mnemonic.split(' ')) {
            await test.step(`Inputting word ${word.slice(0, 4)}`, async () => {
                await TrezorUserEnvLink.inputEmu(word.slice(0, 4));
            });
        }
    }

    @step()
    async enterPinOnBlindMatrix(pinEntryNumber: string) {
        await test.step('Find number on blind matrix and click it', async () => {
            const state = await TrezorUserEnvLink.getDebugState();
            const index = state.matrix.indexOf(pinEntryNumber) + 1;
            await this.pinInput(index).click();
            await this.pinSubmitButton.click();
        });
    }
}
