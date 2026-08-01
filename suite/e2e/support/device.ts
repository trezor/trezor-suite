import { expect } from '@playwright/test';

import type { ApplySettings } from '@trezor/protobuf/src/definitions';
import {
    Model,
    ReadAndConfirmAtomicShamirMnemonicEmu,
    ReadAndConfirmShamirMnemonicEmu,
    SetupEmu,
    TrezorUserEnvLink,
} from '@trezor/trezor-user-env-link';

import { analyzeObject, step } from './common';
import {
    NormalizedDisplayContent,
    parseDisplayContent,
} from './helpers/displayContentNormalizedParser';

const THP_PAIRING_CODE_LENGTH = 6;
const THP_PAIRING_CODE_REGEX = new RegExp(`(\\d\\s*){${THP_PAIRING_CODE_LENGTH}}$`);

const EMULATOR_CENTER_COORDINATES: Record<Model, { x: number; y: number }> = {
    [Model.T3T1]: { x: 125, y: 150 },
    [Model.T3W1]: { x: 200, y: 480 },
    [Model.T1B1]: { x: 0, y: 0 },
    [Model.T2T1]: { x: 0, y: 0 },
    [Model.T3B1]: { x: 0, y: 0 },
};

export class DeviceFixture {
    public readonly hasTHP: boolean;
    public readonly hasSecureElement: boolean;
    public readonly hasCanaryFirmware: boolean;

    constructor(
        public readonly model: Model,
        public readonly firmwareVersion: string,
    ) {
        this.hasTHP = this.model === Model.T3W1;
        this.hasSecureElement = [Model.T3B1, Model.T3T1, Model.T3W1].includes(this.model);
        this.hasCanaryFirmware = firmwareVersion.endsWith('-main');
    }

    @step()
    async powerOn(options: { wipe?: boolean } = {}) {
        await TrezorUserEnvLink.startEmu({
            model: this.model,
            version: this.firmwareVersion,
            wipe: options.wipe ?? false,
        });
    }

    @step()
    async powerOff() {
        await TrezorUserEnvLink.stopEmu();
    }

    @step()
    async setup(deviceSetupConf: SetupEmu) {
        await TrezorUserEnvLink.setupEmu(deviceSetupConf);
    }

    @step()
    async applySettings(settings: ApplySettings) {
        await TrezorUserEnvLink.applySettings(settings);
    }

    @step()
    async pressYes() {
        await TrezorUserEnvLink.pressYes();
    }

    @step()
    async pressNo() {
        await TrezorUserEnvLink.pressNo();
    }

    @step()
    async type(text: string) {
        await TrezorUserEnvLink.inputEmu(text);
    }

    @step()
    async selectNumberOfWords(numOfWords: 12 | 18 | 24 | 20) {
        await TrezorUserEnvLink.selectNumOfWordsEmu(numOfWords);
    }

    @step()
    async inputPin(pin: string) {
        await TrezorUserEnvLink.inputPin(pin);
    }

    @step()
    async tapCenter() {
        await TrezorUserEnvLink.clickEmu(EMULATOR_CENTER_COORDINATES[this.model]);
    }

    @step()
    async pressContinue() {
        if (this.model === Model.T3W1) {
            await TrezorUserEnvLink.clickEmu(EMULATOR_CENTER_COORDINATES[Model.T3W1]);
        } else {
            await TrezorUserEnvLink.swipeEmu('up');
        }
    }

    @step()
    async readAndConfirmShamirMnemonic(options: ReadAndConfirmShamirMnemonicEmu) {
        await TrezorUserEnvLink.readAndConfirmShamirMnemonicEmu(options);
    }

    @step()
    async readAndConfirmAtomicShamirMnemonic(options: ReadAndConfirmAtomicShamirMnemonicEmu) {
        await TrezorUserEnvLink.readAndConfirmAtomicShamirMnemonicEmu(options);
    }

    @step()
    async readAndConfirmSingleShamirMnemonic() {
        await TrezorUserEnvLink.readAndConfirmSingleShamirMnemonicEmu();
    }

    @step()
    async getTHPPairingCode(): Promise<string[]> {
        let code: string[] = [];

        // the device renders the code only once it completes the THP handshake, which lags the host-side confirmation
        await expect(async () => {
            const screenContentBody = (await TrezorUserEnvLink.getScreenContent()).body as string;
            const pairingCode = screenContentBody.match(THP_PAIRING_CODE_REGEX)?.[0];

            if (!pairingCode) {
                throw new Error(
                    `expected a ${THP_PAIRING_CODE_LENGTH}-digit THP pairing code on the device display, got: ${screenContentBody}`,
                );
            }

            code = pairingCode.replace(/\s+/g, '').split('');
        }).toPass({ timeout: 10_000 });

        return code;
    }

    @step()
    async getDebugState() {
        return await TrezorUserEnvLink.getDebugState();
    }

    @step()
    async getAnalyzedDisplayContent() {
        const debugState = await this.getDisplayContent();

        return analyzeObject({
            header: debugState.header,
            body: debugState.body,
            actions: debugState.actions,
            footer: debugState.footer,
        });
    }

    // Serves to quickly get the text from the device display and end the test
    @step()
    async debugThrowJSONFromDisplay() {
        const debugState = await TrezorUserEnvLink.getDebugState();
        const json = JSON.parse(debugState.tokens.join(''));
        throw new Error(
            `Debug JSON: ${JSON.stringify(json, null, 2)} \n\nCharacter analysis: ${JSON.stringify(await this.getAnalyzedDisplayContent(), null, 2)}`,
        );
    }

    @step()
    async getDisplayContent(): Promise<NormalizedDisplayContent> {
        const debugState = await TrezorUserEnvLink.getDebugState();
        let raw: any;
        try {
            raw = JSON.parse(debugState.tokens.join(''));
        } catch (error) {
            throw new Error(`Failed to parse display content JSON: ${debugState.tokens.join('')}`, {
                cause: error as Error,
            });
        }

        return parseDisplayContent(raw);
    }

    private wrapTextByLineLimit = (
        text: string,
        lineCharLimit: number,
        newline: string | string[],
    ) => {
        const regex = new RegExp(`.{1,${lineCharLimit}}`, 'g');
        const splitLines = text.match(regex);
        if (!splitLines) {
            throw new Error(`Failed to split text into lines: "${text}"`);
        }

        const newlineArray = Array.isArray(newline) ? newline : [newline];

        return splitLines.flatMap((line, index) =>
            index < splitLines.length - 1 ? [line.trim(), ...newlineArray] : [line.trim()],
        );
    };

    private wrapTextByWords = (
        text: string,
        lineCharLimit: number,
        options?: { hyphenate?: boolean },
    ) => {
        const lines: string[] = [];
        let rest = text;

        // Greedily fill each line. Break at the last space that fits; when no
        // space fits, either hyphenate the word (the dash takes one slot) or,
        // if hyphenation is off, overflow up to the next space.
        while (rest.length > lineCharLimit) {
            const lastWhitespaceIndex = rest.lastIndexOf(' ', lineCharLimit);
            const hasFittingWhitespace = lastWhitespaceIndex > 0;

            if (hasFittingWhitespace) {
                lines.push(rest.slice(0, lastWhitespaceIndex), '\n');
                rest = rest.slice(lastWhitespaceIndex + 1);
            } else if (options?.hyphenate) {
                lines.push(rest.slice(0, lineCharLimit - 1), '-', '\n');
                rest = rest.slice(lineCharLimit - 1);
            } else {
                const nextSpace = rest.indexOf(' ');
                if (nextSpace === -1) break;
                lines.push(rest.slice(0, nextSpace), '\n');
                rest = rest.slice(nextSpace + 1);
            }
        }

        lines.push(rest);

        return lines;
    };

    wrapText = (
        text: string,
        options?: { isAmount?: boolean; wrapByWords?: boolean; lengthOverride?: number },
    ) => {
        const T3W1_EXACT_LINE_LENGTH = options?.lengthOverride ?? 14;
        const T3T1_EXACT_LINE_LENGTH = options?.lengthOverride ?? 18;

        if (this.model === Model.T3W1) {
            // Wrap by words with conditional hyphenation for amounts
            // Amounts have potentially long decimal parts -> hyphenation
            if (options?.isAmount || options?.wrapByWords) {
                return this.wrapTextByWords(text, T3W1_EXACT_LINE_LENGTH, {
                    hyphenate: options?.isAmount,
                });
            }

            // Otherwise wrap by chars at the size limit
            return this.wrapTextByLineLimit(text, T3W1_EXACT_LINE_LENGTH, ['\n']);
        }

        if (options?.wrapByWords) {
            return this.wrapTextByWords(text, T3T1_EXACT_LINE_LENGTH);
        }

        return this.wrapTextByLineLimit(text, T3T1_EXACT_LINE_LENGTH, ['\n']);
    };

    @step()
    async openFeeInfo({
        buttonIndexT3W1 = 1,
        buttonIndexT3T1 = 1,
    }: {
        buttonIndexT3W1?: number;
        buttonIndexT3T1?: number;
    } = {}) {
        const EMULATOR_BURGER_MENU_COORDINATES: Record<Model, { x: number; y: number }> = {
            [Model.T3T1]: { x: 200, y: 20 },
            [Model.T3W1]: { x: 300, y: 20 },
            [Model.T1B1]: { x: 0, y: 0 },
            [Model.T2T1]: { x: 0, y: 0 },
            [Model.T3B1]: { x: 0, y: 0 },
        };
        await TrezorUserEnvLink.clickEmu(EMULATOR_BURGER_MENU_COORDINATES[this.model]);
        const EMULATOR_FEE_INFO_COORDINATES: Record<Model, { x: number; y: number }> = {
            [Model.T3T1]: { x: 125, y: buttonIndexT3T1 * 100 },
            [Model.T3W1]: { x: 125, y: buttonIndexT3W1 * 100 },
            [Model.T1B1]: { x: 0, y: 0 },
            [Model.T2T1]: { x: 0, y: 0 },
            [Model.T3B1]: { x: 0, y: 0 },
        };
        await TrezorUserEnvLink.clickEmu(EMULATOR_FEE_INFO_COORDINATES[this.model]);
    }

    @step()
    async expectToContainOnDisplay(expectedText: string) {
        await expect(async () => {
            const displayBodyContent = (await this.getDisplayContent()).body;
            const flattenedLines = displayBodyContent.map(line => line.join(' '));
            const found = flattenedLines.some(line => line.includes(expectedText));

            if (!found) {
                throw new Error(
                    `Expected text "${expectedText}" not found on the device display. Actual display text:\n"${JSON.stringify(flattenedLines, null, 2)}"`,
                );
            }
        }).toPass({ timeout: 5_000 });
    }
}
