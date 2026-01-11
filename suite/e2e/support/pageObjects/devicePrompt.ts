import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLinkProxy, analyzeObject, step } from '../common';
import {
    NormalizedDisplayContent,
    parseDisplayContent,
} from '../helpers/displayContentNormalizedParser';
import { ModelFixture } from '../modelFixture';

export class DevicePrompt {
    readonly confirmOnDevicePrompt: Locator;
    readonly connectDevicePrompt: Locator;
    readonly modal: Locator;
    readonly modalCloseButton: Locator;
    private readonly paginatedText: Locator;
    private readonly paginatedTextSeparator: Locator;
    readonly chunkedText: Locator;
    readonly outputValue: Locator;
    readonly outputValueOf = (
        section: 'default' | 'address' | 'data' | 'amount' | 'fee' | 'total' | 'contract',
    ) => this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/output-value');
    readonly cryptoAmountWithSymbolOf = (section: 'amount' | 'fee' | 'total') =>
        this.page
            .getByTestId(`@modal/output-${section}`)
            .getByTestId('@modal/crypto-amount-with-symbol');
    readonly cryptoAmountOf = (section: 'amount' | 'fee' | 'total') =>
        this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/crypto-amount');
    readonly fiatAmountOf = (section: 'amount' | 'fee' | 'total') =>
        this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/fiat-amount');
    readonly reviewAmount: Locator;
    readonly sendButton: Locator;
    readonly header: Locator;
    readonly headerParagraph: Locator;
    readonly acquireDeviceButton: Locator;
    readonly closeButton: Locator;
    readonly ethereumGasLimit: Locator;
    readonly ethereumFeeRate: Locator;
    readonly ethereumPriorityFeeRate: Locator;
    readonly headerFeeRate: Locator;

    constructor(
        private page: Page,
        readonly model: ModelFixture,
    ) {
        this.confirmOnDevicePrompt = page.getByTestId('@prompts/confirm-on-device');
        this.connectDevicePrompt = page.getByTestId('@connect-device-prompt');
        this.modalCloseButton = page.getByTestId('@modal/close-button');
        this.modal = page.modal;
        this.paginatedText = page.locator("[data-testid-alt='@device-display/paginated-text']");
        this.paginatedTextSeparator = page.getByTestId('@device-display/paginated-text/separator');
        this.chunkedText = page.getByTestId('@device-display/chunked-text');
        this.outputValue = page.getByTestId('@modal/output-value');
        this.reviewAmount = page.getByTestId('@modal/transaction-review/amount');
        this.sendButton = page.getByTestId('@modal/send');
        this.header = page.getByTestId('@modal/header');
        this.headerParagraph = page.getByTestId('@modal/header-paragraph');
        this.acquireDeviceButton = this.page.getByTestId('@device-acquire');
        this.closeButton = this.page.getByTestId('@confirm-on-device/close-button');
        this.ethereumGasLimit = this.page.getByTestId('@modal/ethereum/gas-limit');
        this.ethereumFeeRate = this.page
            .getByTestId('@modal/ethereum/fee')
            .getByTestId('@fee-rate');
        this.ethereumPriorityFeeRate = this.page
            .getByTestId('@modal/ethereum/priority-fee')
            .getByTestId('@fee-rate');
        this.headerFeeRate = this.page.getByTestId('@fee-rate');
    }

    @step()
    async confirmOnDevicePromptIsShown(params?: { timeout?: number }) {
        await expect(
            this.confirmOnDevicePrompt,
            "'confirm on device' prompt should be visible",
        ).toBeVisible({ timeout: params?.timeout });
    }

    @step()
    async confirmOnDeviceIsCompleted() {
        await this.confirmOnDevicePromptIsShown();
        await expect(this.confirmOnDevicePrompt).toHaveText('Confirm on TrezorConfirmed');
    }

    @step()
    async confirmOnDevicePromptIsHidden() {
        await expect(this.confirmOnDevicePrompt).toBeHidden();
    }

    @step()
    async connectDevicePromptIsShown(params?: { timeout?: number }) {
        await expect(this.connectDevicePrompt).toBeVisible({ timeout: params?.timeout });
    }

    @step()
    async waitForPromptAndConfirm() {
        await this.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();
    }

    @step()
    async allowConnectToTrezor() {
        await this.confirmOnDevicePromptIsShown({ timeout: 30_000 });
        await TrezorUserEnvLinkProxy.pressYes();
    }

    @step()
    async waitForPromptAndClick(): Promise<void> {
        const EMULATOR_CENTER_COORDINATES: Record<string, { x: number; y: number }> = {
            T3T1: { x: 125, y: 150 },
            T3W1: { x: 200, y: 480 },
        };

        await this.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.clickEmu(EMULATOR_CENTER_COORDINATES[this.model.model]);
    }

    @step()
    async waitForFinalPromptAndConfirm() {
        await this.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();
        await this.confirmOnDeviceIsCompleted();
    }

    @step()
    private async getPaginatedTextSeparator(): Promise<string | false> {
        const isSeparatorVisible = await this.paginatedTextSeparator.isVisible();
        if (!isSeparatorVisible) {
            return false;
        }
        const separatorText = await this.paginatedTextSeparator.textContent();

        return typeof separatorText === 'string' ? separatorText : false;
    }

    @step()
    async combinedPaginatedText() {
        let textsArray = await this.paginatedText.allTextContents();
        const separatorText = await this.getPaginatedTextSeparator();
        if (separatorText) {
            textsArray = textsArray.map(text => text.replace(separatorText, ''));
        }
        const removeWhitespaces = (text: string) => text.replace(/\s+/g, '');

        return textsArray.map(removeWhitespaces).join('');
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
        const debugState = await TrezorUserEnvLinkProxy.getDebugState();
        const json = JSON.parse(debugState.tokens.join(''));
        throw new Error(
            `Debug JSON: ${JSON.stringify(json, null, 2)} \n\nCharacter analysis: ${JSON.stringify(await this.getAnalyzedDisplayContent(), null, 2)}`,
        );
    }

    @step()
    async getDisplayContent(): Promise<NormalizedDisplayContent> {
        const debugState = await TrezorUserEnvLinkProxy.getDebugState();
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

    @step()
    async getFeeRate() {
        // Element format is: Bitcoin #1 \n+ ≈ 10 minutes \n+ 4.00 sat/vB
        const fullText = await this.headerParagraph.textContent();
        if (!fullText) {
            throw new Error('No text found in header paragraph of device prompt');
        }

        const lines = fullText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        const feeRateRegex = /^\d+(\.\d+)?\s+sat\/vB$/;
        if (!feeRateRegex.test(lines[lines.length - 1])) {
            throw new Error(
                `Last line does not match the expected format of a decimal number followed by 'sat/vB': ${lines[lines.length - 1]}`,
            );
        }

        return lines[lines.length - 1];
    }

    @step()
    async openFeeInfoOnEmulator({
        buttonIndexT3W1 = 1,
        buttonIndexT3T1 = 1,
    }: {
        buttonIndexT3W1?: number;
        buttonIndexT3T1?: number;
    } = {}) {
        const EMULATOR_BURGER_MENU_COORDINATES: Record<string, { x: number; y: number }> = {
            T3T1: { x: 200, y: 20 },
            T3W1: { x: 300, y: 20 },
        };
        await TrezorUserEnvLinkProxy.clickEmu(EMULATOR_BURGER_MENU_COORDINATES[this.model.model]);
        const EMULATOR_FEE_INFO_COORDINATES: Record<string, { x: number; y: number }> = {
            T3T1: { x: 125, y: buttonIndexT3T1 * 100 },
            T3W1: { x: 125, y: buttonIndexT3W1 * 100 },
        };
        await TrezorUserEnvLinkProxy.clickEmu(EMULATOR_FEE_INFO_COORDINATES[this.model.model]);
    }

    @step()
    async closeModal() {
        await this.modalCloseButton.click();
        await expect(this.modal).toBeHidden();
    }

    @step()
    async getAddress() {
        // may not work for multi page addresses
        await this.confirmOnDevicePromptIsShown();
        const addressRaw = (await this.getDisplayContent()).body;
        if (!addressRaw) {
            throw new Error('No address found on emulator display');
        }

        return addressRaw[0].join('').replace(/\n/g, '');
    }

    getDeviceModel() {
        return this.model.model;
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

    wrapText = (text: string, options?: { isAmount?: boolean }) => {
        const T3W1_EXACT_LINE_LENGTH = 14;
        const T3T1_EXACT_LINE_LENGTH = 18;
        const T3W1_LINE_LENGTH_MINUS_DASH = 13;

        if (this.model.isT3W1()) {
            if (text.length === T3W1_EXACT_LINE_LENGTH) {
                return [text];
            }
            const lineCharLimit = options?.isAmount
                ? T3W1_LINE_LENGTH_MINUS_DASH
                : T3W1_EXACT_LINE_LENGTH;
            const newline = options?.isAmount ? ['-', '\n'] : ['\n'];

            return this.wrapTextByLineLimit(text, lineCharLimit, newline);
        }

        return this.wrapTextByLineLimit(text, T3T1_EXACT_LINE_LENGTH, ['\n']);
    };
}
