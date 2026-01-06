import { Locator, Page, expect } from '@playwright/test';

import { Model } from '@trezor/trezor-user-env-link';

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
        private readonly model: ModelFixture,
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
    async waitForPromptAndClick(model?: Model): Promise<void> {
        const EMULATOR_CENTER_COORDINATES: Record<string, { x: number; y: number }> = {
            T3T1: { x: 125, y: 150 },
            T3W1: { x: 200, y: 480 },
        };

        await this.confirmOnDevicePromptIsShown();

        await TrezorUserEnvLinkProxy.clickEmu(EMULATOR_CENTER_COORDINATES[model ?? 'T3T1']);
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
}
