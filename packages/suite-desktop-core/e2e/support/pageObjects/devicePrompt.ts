import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLinkProxy, step } from '../common';

export class DevicePrompt {
    readonly confirmOnDevicePrompt: Locator;
    readonly connectDevicePrompt: Locator;
    readonly modal: Locator;
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
    readonly headerFeeRate: Locator;

    constructor(private page: Page) {
        this.confirmOnDevicePrompt = page.getByTestId('@prompts/confirm-on-device');
        this.connectDevicePrompt = page.getByTestId('@connect-device-prompt');
        this.modal = page.getByTestId('@modal');
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
        this.headerFeeRate = this.page.getByTestId('@fee-rate');
    }

    @step()
    async confirmOnDevicePromptIsShown() {
        await expect(
            this.confirmOnDevicePrompt,
            "'confirm on device' prompt should be visible",
        ).toBeVisible();
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
    async connectDevicePromptIsShown() {
        await expect(this.connectDevicePrompt).toBeVisible();
    }

    @step()
    async waitForPromptAndConfirm() {
        await this.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();
    }

    @step()
    async waitForPromptAndClick() {
        await this.confirmOnDevicePromptIsShown();
        const emulatorCenterCoordinates = { x: 125, y: 150 };
        await TrezorUserEnvLinkProxy.clickEmu(emulatorCenterCoordinates);
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

    // Serves to quickly get the text from the device display and end the test
    @step()
    async debugThrowJSONFromDisplay() {
        const debugState = await TrezorUserEnvLinkProxy.getDebugState();
        const json = JSON.parse(debugState.tokens.join(''));
        throw new Error(`Debug JSON: ${JSON.stringify(json, null, 2)}`);
    }

    @step()
    async getDisplayContent() {
        const debugState = await TrezorUserEnvLinkProxy.getDebugState();
        const json = JSON.parse(debugState.tokens.join(''));
        if (!json || !json.header || !json.content) {
            throw new Error(
                `Display content invalid, should contain header and content: ${JSON.stringify(json)}`,
            );
        }
        // The structure of the JSON differs between situations.
        // We will have to add more logic as we start validate more situations.
        // Header may have optional subtitle
        // Footer is optional completely
        const header = {
            title: json.header.title.text,
            ...(json.header.subtitle && { subtitle: json.header.subtitle.text }),
        };

        if (json.content.content.paragraphs.length < 1) {
            throw new Error(
                `Expected at least one paragraph in display JSON, JSON: ${JSON.stringify(json.content.content.paragraphs)}`,
            );
        }

        return {
            header,
            body: json.content.content.paragraphs,
            ...(json.footer && { footer: json.footer.instruction }),
        };
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
}
