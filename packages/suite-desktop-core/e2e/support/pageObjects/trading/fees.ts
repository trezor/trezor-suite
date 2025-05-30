import { Locator, Page, Response } from '@playwright/test';

import { step } from '../../common';
import { solanaUrlPattern } from '../../mocks/tradingMock';
import { expect } from '../../testExtends/customMatchers';

export type FeeTypes = 'economy' | 'normal' | 'high';

export class Fees {
    readonly switchModeButton = (feeMode: 'normal' | 'custom') =>
        this.page.getByTestId(`select-bar/${feeMode}`);
    readonly bitcoinCard = (feeType: FeeTypes) =>
        this.page.getByTestId(`@fee-card/${feeType}-card`);
    readonly bitcoinValue = (feeType: FeeTypes) =>
        this.page.getByTestId(`@fee-card/${feeType}-fait-amount`);
    readonly bitcoinRate = (feeType: FeeTypes) =>
        this.page.getByTestId(`@fee-card/${feeType}-rate`);
    readonly customInput: Locator;
    readonly customAmount: Locator;
    readonly customFiatAmount: Locator;
    readonly miscAmount: Locator;
    readonly swapDetails: Locator;
    readonly dustPreventionNotice: Locator;
    readonly ethereumFeeLimit: Locator;
    readonly ethereumMaxFeePerGas: Locator;
    readonly ethereumMaxPriorityFeePerGas: Locator;

    constructor(private readonly page: Page) {
        this.customInput = this.page.getByTestId('feePerUnit');
        this.customAmount = this.page.getByTestId('@trading/quote/custom-fee-amount');
        this.customFiatAmount = this.page.getByTestId('@trading/quote/custom-fee-fiat-amount');
        this.miscAmount = this.page.getByTestId('@wallet/misc-fee-amount');
        this.swapDetails = this.page.getByTestId('@wallet/fee-details');
        this.dustPreventionNotice = this.page.getByTestId('@wallet/fees/dust-prevention-notice');
        this.ethereumFeeLimit = this.page.getByTestId('feeLimit');
        this.ethereumMaxFeePerGas = this.page.getByTestId('maxFeePerGas');
        this.ethereumMaxPriorityFeePerGas = this.page.getByTestId('maxPriorityFeePerGas');
    }

    @step()
    promiseForResponseSolanaFeeCalls() {
        const isSolanaResponse = (response: Response, method: string) =>
            new RegExp(solanaUrlPattern).test(response.url()) &&
            response.request().postDataJSON().method === method;
        const getFeeForMessagePromise = this.page.waitForResponse(response =>
            isSolanaResponse(response, 'getFeeForMessage'),
        );
        const getRecentPrioritizationFeesPromise = this.page.waitForResponse(response =>
            isSolanaResponse(response, 'getRecentPrioritizationFees'),
        );
        const simulateTransactionPromise = this.page.waitForResponse(response =>
            isSolanaResponse(response, 'simulateTransaction'),
        );

        // Suite calls the each request twice and we have to wait for all of them
        return Promise.all([
            getFeeForMessagePromise,
            getRecentPrioritizationFeesPromise,
            simulateTransactionPromise,
            getFeeForMessagePromise,
            getRecentPrioritizationFeesPromise,
            simulateTransactionPromise,
        ]);
    }

    @step()
    async getSolanaFee() {
        const lamportsToSolanaRatio = 1_000_000_000;
        await expect(this.miscAmount).toBeVisible();
        const feeWithSymbol = await this.miscAmount.textContent();
        if (!feeWithSymbol) {
            throw new Error('Fee amount is undefined or null');
        }

        const feeParts = feeWithSymbol.split(' ');
        if (feeParts.length === 0 || isNaN(parseFloat(feeParts[0]))) {
            throw new Error('Fee amount is invalid');
        }

        return parseFloat(feeParts[0]) / lamportsToSolanaRatio;
    }

    @step()
    async expectBitcoinFeeCalculated() {
        const feePattern = /[≈~]\s*\$\s*\d+\.\d+/;
        await expect(this.bitcoinValue('economy')).toHaveText(feePattern);
        await expect(this.bitcoinValue('normal')).toHaveText(feePattern);
        await expect(this.bitcoinValue('high')).toHaveText(feePattern);
    }

    @step()
    async getBitcoinFeeRate(type: FeeTypes | 'custom') {
        let feeRateText: string | null;
        const nonBreakingSpace = '\u00A0';
        const suffixForDustPreventionFee = `${nonBreakingSpace}sat/vB`;
        const suffixForCustomFee = `.00${nonBreakingSpace}sat/vB`;

        if (type !== 'custom') {
            await this.expectBitcoinFeeCalculated();
            feeRateText = await this.bitcoinRate(type).textContent();
        } else {
            feeRateText = (await this.customInput.inputValue()) + suffixForCustomFee;
        }

        const isDustPreventionRateApplied = await this.dustPreventionNotice.isVisible();
        if (isDustPreventionRateApplied) {
            feeRateText = (await this.getDustPreventionFeeRate()) + suffixForDustPreventionFee;
        }

        if (!feeRateText) {
            throw new Error('Fee amount is undefined or null');
        }

        return feeRateText;
    }

    calculateEthereumMaxFee(params: { gasLimit: string; maxFeePerGas: string }) {
        const ratioToEthereum = 1e9;
        const maxFeeInEthereum =
            (parseFloat(params.gasLimit) * parseFloat(params.maxFeePerGas)) / ratioToEthereum;
        const maxFeeRounded = maxFeeInEthereum.toFixed(14);

        // This method is also providing detailed error message for troubleshooting expect if it fails
        const errorMessageMaxCalculation = `expected to have max Fee: 
"(parseFloat(${params.gasLimit}) * parseFloat(${params.maxFeePerGas})) / ${ratioToEthereum}"
here are applied parseFloats:
(${parseFloat(params.gasLimit)} * ${parseFloat(params.maxFeePerGas)}) / ${ratioToEthereum}
before rounding: ${maxFeeInEthereum} ETH, after rounding: ${maxFeeRounded} ETH`;

        return {
            ethereumMaximumFee: maxFeeRounded,
            errorMessageMaxCalculation,
        };
    }

    @step()
    async getDustPreventionFeeRate() {
        const dustPreventionText = await this.dustPreventionNotice.textContent();
        if (!dustPreventionText) {
            throw new Error('Dust prevention text is undefined or null');
        }

        const regex = /has been adjusted to (?<value>\d+\.\d+) sat\/vB/;
        const match = dustPreventionText.match(regex);

        if (!match?.groups?.value) {
            throw new Error(`Failed to extract fee rate from text: "${dustPreventionText}"`);
        }

        return match.groups.value;
    }
}
