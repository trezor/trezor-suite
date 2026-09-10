import { Locator, Page } from '@playwright/test';

import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export type FeeTypes = 'low' | 'economy' | 'normal' | 'high';

export class FeeSection {
    readonly switchModeButton = (feeMode: 'standard' | 'custom') =>
        this.page.getByTestId(`@wallet/fees/select-${feeMode}-fee`);
    readonly card = (feeType: FeeTypes) => this.page.getByTestId(`@fee-card/${feeType}-card`);
    readonly valueOnCard = (feeType: FeeTypes) =>
        this.page.getByTestId(`@fee-card/${feeType}-fiat-amount`);
    readonly rateOnCard = (feeType: FeeTypes) => this.page.getByTestId(`@fee-card/${feeType}-rate`);
    readonly rateValueOnCard = (feeType: FeeTypes) =>
        this.rateOnCard(feeType).getByTestId('@fee-rate/value');
    readonly collapsibleFeesToggle: Locator;
    readonly collapsibleFees: Locator;
    readonly customInput: Locator;
    readonly maxFee: Locator;
    readonly maxFeeWithSymbol: Locator;
    readonly maxFeeFiat: Locator;
    readonly swapDetails: Locator;
    readonly dustPreventionNotice: Locator;
    readonly ethereumFeeLimit: Locator;
    readonly ethereumMaxFeePerGas: Locator;
    readonly ethereumMaxPriorityFeePerGas: Locator;
    readonly networkReserveBanner: Locator;
    readonly maximumFeeAmountToBeCalculated: Locator;
    readonly networkFeeRow: Locator;
    readonly networkFeeModalConfirmButton: Locator;
    readonly networkFeeModalCancelButton: Locator;

    constructor(private readonly page: Page) {
        this.collapsibleFeesToggle = this.page.getByTestId('@wallet/fees/collapsible-fees-toggle');
        this.collapsibleFees = this.page.getByTestId('@wallet/fees/collapsible-fees');
        this.customInput = this.page.getByTestId('feePerUnit');
        this.maxFee = this.page.getByTestId('@trading/quote/maximum-fee-amount');
        this.maxFeeWithSymbol = this.page.getByTestId(
            '@trading/quote/maximum-fee-amount-with-symbol',
        );
        this.maxFeeFiat = this.page.getByTestId('@trading/quote/maximum-fee-fiat-amount');
        this.swapDetails = this.page.getByTestId('@wallet/fee-details');
        this.dustPreventionNotice = this.page.getByTestId('@wallet/fees/dust-prevention-notice');
        this.ethereumFeeLimit = this.page.getByTestId('feeLimit');
        this.ethereumMaxFeePerGas = this.page.getByTestId('maxFeePerGas');
        this.ethereumMaxPriorityFeePerGas = this.page.getByTestId('maxPriorityFeePerGas');
        this.networkReserveBanner = this.page.getByTestId('@send/network-reserve-banner');
        this.maximumFeeAmountToBeCalculated = this.page.getByTestId(
            '@trading/quote/maximum-fee-amount-to-be-calculated',
        );
        this.networkFeeRow = this.page.getByTestId('@trading/offer/info/network-fee');
        this.networkFeeModalConfirmButton = this.page.getByTestId(
            '@trading/network-fee-modal/confirm',
        );
        this.networkFeeModalCancelButton = this.page.getByTestId(
            '@trading/network-fee-modal/cancel',
        );
    }

    @step()
    async openCollapsibleFees() {
        const isExpanded = await this.collapsibleFees.getAttribute('aria-expanded');

        if (isExpanded === 'true') {
            return;
        }

        await expect(this.maximumFeeAmountToBeCalculated).toBeHidden();

        const isDisabled = await this.collapsibleFeesToggle.getAttribute('aria-disabled');

        if (isDisabled === 'true') {
            console.error(
                new Error(
                    `Can't open collapsible fees because it is disabled. Make sure 'to' and 'amount' fields are filled so that maximum fee is calculated.`,
                ),
            );
        }

        await expect(this.collapsibleFees).toHaveAttribute('aria-expanded', 'false');
        await this.collapsibleFeesToggle.click();
        await expect(this.collapsibleFees).toHaveAttribute('aria-expanded', 'true');
    }

    @step()
    async getSolanaFee() {
        await expect(this.maxFee).toBeVisible();
        const feeWithSymbol = await this.maxFee.innerText();
        const feeParts = feeWithSymbol.split(' ');
        const feeValue = feeParts[0];
        if (!feeValue || isNaN(parseFloat(feeValue))) {
            throw new Error('Fee amount is invalid');
        }

        return parseFloat(feeValue);
    }

    @step()
    async expectBitcoinFeeCalculated() {
        await this.openCollapsibleFees();

        const feePattern = /[≈~]\s*\$\s*\d+\.\d+/;
        await expect(this.valueOnCard('economy')).toHaveText(feePattern);
        await expect(this.valueOnCard('normal')).toHaveText(feePattern);
        await expect(this.valueOnCard('high')).toHaveText(feePattern);
    }

    @step()
    async expectEthereumFeeCalculated() {
        await this.openCollapsibleFees();

        const feePattern = /\d+\.\d+\s*Gwei/;
        await expect(this.rateOnCard('low')).toHaveText(feePattern);
        await expect(this.rateOnCard('normal')).toHaveText(feePattern);
        await expect(this.rateOnCard('high')).toHaveText(feePattern);
    }

    @step()
    async getBitcoinFeeRate(type: FeeTypes | 'custom') {
        let feeRate: string;

        if (type !== 'custom') {
            await this.expectBitcoinFeeCalculated();
            feeRate = await this.rateValueOnCard(type).innerText();
        } else {
            feeRate = new BigNumber(await this.customInput.inputValue()).toFixed(2);
        }

        const isDustPreventionRateApplied = await this.dustPreventionNotice.isVisible();
        if (isDustPreventionRateApplied) {
            feeRate = await this.getDustPreventionFeeRate();
        }

        return feeRate;
    }

    calculateEthereumMaxFee({
        gasLimit,
        maxFeePerGas,
        numberOfDecimals = 14,
    }: {
        gasLimit: string;
        maxFeePerGas: string;
        numberOfDecimals?: number;
    }) {
        const ratioToEthereum = 1e9;
        const maxFeeInEthereum =
            (parseFloat(gasLimit) * parseFloat(maxFeePerGas)) / ratioToEthereum;
        const maxFeeRounded = localizeNumber(maxFeeInEthereum, 'en-US', 0, numberOfDecimals);
        // This method is also providing detailed error message for troubleshooting expect if it fails
        const errorMessageMaxCalculation = `expected to have max Fee: 
"(parseFloat(${gasLimit}) * parseFloat(${maxFeePerGas})) / ${ratioToEthereum}"
here are applied parseFloats:
(${parseFloat(gasLimit)} * ${parseFloat(maxFeePerGas)}) / ${ratioToEthereum}
before rounding: ${maxFeeInEthereum} ETH, after rounding: ${maxFeeRounded} ETH`;

        return {
            ethereumMaximumFee: maxFeeRounded,
            errorMessageMaxCalculation,
        };
    }

    @step()
    async getDustPreventionFeeRate() {
        const dustPreventionText = await this.dustPreventionNotice.innerText();
        const regex = /has been adjusted to (?<value>\d+\.\d+) sat\/vB/;
        const match = dustPreventionText.match(regex);

        if (!match?.groups?.value) {
            throw new Error(`Failed to extract fee rate from text: "${dustPreventionText}"`);
        }

        return match.groups.value;
    }

    @step()
    async switchToCustom() {
        await this.openCollapsibleFees();
        await this.switchModeButton('custom').click();
    }
    @step()
    async switchToStandard() {
        await this.openCollapsibleFees();
        await this.switchModeButton('standard').click();
    }

    @step()
    async openNetworkFeeModal() {
        await this.networkFeeRow.click();
        await expect(this.networkFeeModalConfirmButton).toBeVisible();
    }

    @step()
    async confirmNetworkFeeModal() {
        await expect(this.networkFeeModalConfirmButton).toBeEnabled();
        await this.networkFeeModalConfirmButton.click();
        await expect(this.networkFeeModalConfirmButton).toBeHidden();
    }

    @step()
    async closeNetworkFeeModal() {
        await this.networkFeeModalCancelButton.click();
        await expect(this.networkFeeModalConfirmButton).toBeHidden();
    }

    @step()
    async setEthereumCustomFees(input: {
        gasLimit: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
    }) {
        await this.switchToCustom();
        await this.fillEthereumCustomFees(input);
    }

    @step()
    async setEthereumCustomFeesInNetworkFeeModal(input: {
        gasLimit: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
    }) {
        await this.openNetworkFeeModal();
        await this.switchModeButton('custom').click();
        await this.fillEthereumCustomFees(input);
        await this.confirmNetworkFeeModal();
    }

    private async fillEthereumCustomFees(input: {
        gasLimit: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
    }) {
        await this.ethereumFeeLimit.fill(input.gasLimit);
        await this.ethereumMaxFeePerGas.fill(input.maxFeePerGas);
        await this.ethereumMaxPriorityFeePerGas.fill(input.maxPriorityFeePerGas);
    }

    @step()
    async getNetworkReserveAmount() {
        const bannerText = await this.networkReserveBanner.innerText();
        const regex = /(\d+(?:\.\d+)?)(?=\s*SOL)/;
        const match = bannerText.match(regex);

        if (!match || !match[1]) {
            throw new Error(`Failed to extract network reserve amount from text: "${bannerText}"`);
        }

        return Number(match[1]);
    }

    @step()
    async getStandardFeeWorkaround() {
        await this.switchToCustom();
        const fees = await this.readEthereumCustomFees();
        await this.switchToStandard();

        return fees;
    }

    @step()
    async getStandardFeeWorkaroundInNetworkFeeModal() {
        await this.openNetworkFeeModal();
        await this.switchModeButton('custom').click();
        const fees = await this.readEthereumCustomFees();
        await this.switchModeButton('standard').click();
        await this.closeNetworkFeeModal();

        return fees;
    }

    private async readEthereumCustomFees() {
        const gasLimit = (await this.ethereumFeeLimit.inputValue()).replace(/,/g, '');
        const maxFeePerGas = await this.ethereumMaxFeePerGas.inputValue();
        const maxFeePerGasRounded = new BigNumber(maxFeePerGas)
            .decimalPlaces(4, BigNumber.ROUND_UP)
            .toFixed(4);
        const maxPriorityFeePerGas = await this.ethereumMaxPriorityFeePerGas.inputValue();
        const maxPriorityFeePerGasRounded = new BigNumber(maxPriorityFeePerGas)
            .decimalPlaces(4, BigNumber.ROUND_UP)
            .toFixed(4);

        return {
            gasLimit,
            maxFeePerGas,
            maxPriorityFeePerGas,
            maxFeePerGasRounded,
            maxPriorityFeePerGasRounded,
        };
    }

    @step()
    async waitToBeCalculated() {
        await expect(this.maximumFeeAmountToBeCalculated).toBeHidden();
    }
}
