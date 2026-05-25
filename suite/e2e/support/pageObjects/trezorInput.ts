import { Locator, Page, test } from '@playwright/test';

import { step } from '../common';
import { DeviceFixture } from '../device';

export class TrezorInput {
    readonly wordSelectInput: Locator;
    readonly wordOption = (word: string) =>
        this.page.getByTestId(`@word-input-select/option/${word}`);
    readonly pinSubmitButton: Locator;
    readonly pinInput = (index: number) => this.page.getByTestId(`@pin/input/${index}`);

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
    ) {
        this.wordSelectInput = page.getByTestId('@word-input-select/input');
        this.pinSubmitButton = this.page.getByTestId('@pin/submit-button');
    }

    @step()
    async inputWord(word: string) {
        await this.wordSelectInput.click();
        await this.wordSelectInput.type(word);
        await this.wordOption(word).click();
    }

    @step()
    async inputMnemonicT1B1(mnemonic: string) {
        const arrayMnemonic = mnemonic.split(' ');
        for (let i = 0; i < 24; i++) {
            await this.page.waitForTimeout(500); // try to prevent race condition, that happens with t1b1 with node bridge
            const state = await this.device.getDebugState();
            const position = state.recovery_word_pos - 1;
            const isGivenFakeWord = position === -1;
            if (isGivenFakeWord) {
                await test.step(`Inputting fake word ${state.recovery_fake_word}`, async () => {
                    await this.inputWord(state.recovery_fake_word);
                });
            } else {
                await test.step(`Inputting word ${arrayMnemonic[position] ?? ''} at position ${position}`, async () => {
                    await this.inputWord(arrayMnemonic[position] ?? '');
                });
            }
        }
    }

    //TODO: #16107 Not working with anything else than 12x 'all' - I will ask around
    @step()
    async inputMnemonicT2T1(mnemonic: string) {
        for (const word of mnemonic.split(' ')) {
            await this.device.type(word.slice(0, 4));
        }
    }

    @step()
    async enterPinOnBlindMatrix(pinEntryNumber: string) {
        await test.step('Find number on blind matrix and click it', async () => {
            // try to prevent race condition, that happens with t1b1 with node bridge
            await this.page.waitForTimeout(500);

            const state = await this.device.getDebugState();
            for (const number of pinEntryNumber) {
                const index = state.matrix.indexOf(number) + 1;
                await this.pinInput(index).click();
            }
            await this.pinSubmitButton.click();
        });
    }
}
