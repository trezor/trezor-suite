import { Locator, Page } from '@playwright/test';

export class DevicePromptHeaderSection {
    readonly container: Locator;
    readonly accountLabel: Locator;
    readonly estimatedTime: Locator;
    readonly estimatedTimeValue: Locator;
    readonly feeRate: Locator;
    readonly feeRateValue: Locator;
    readonly feeRateChanged: Locator;
    readonly broadcast: Locator;
    readonly broadcastState: Locator;
    readonly nonce: Locator;
    readonly nonceValue: Locator;
    readonly gasLimit: Locator;
    readonly gasLimitValue: Locator;
    readonly feePerGas: Locator;
    readonly feePerGasRate: Locator;
    readonly feePerGasValue: Locator;
    readonly priorityFee: Locator;
    readonly priorityFeeRate: Locator;
    readonly priorityFeeValue: Locator;
    readonly tronBurned: Locator;
    readonly tronBandwidth: Locator;
    readonly tronEnergy: Locator;
    readonly computeUnitLimitValue: Locator;
    readonly computeUnitPriceValue: Locator;
    readonly connectSource: Locator;
    readonly timer: Locator;
    readonly tryAgainButton: Locator;
    readonly detailsButton: Locator;

    constructor(private readonly page: Page) {
        this.container = this.page.getByTestId('@modal/header-paragraph');
        this.accountLabel = this.container.getByTestId('@modal/header/account-label');
        this.estimatedTime = this.container.getByTestId('@modal/header/estimated-time');
        this.estimatedTimeValue = this.container.getByTestId('@modal/header/estimated-time/value');
        this.feeRate = this.container.getByTestId('@modal/header/fee-rate');
        this.feeRateValue = this.feeRate.getByTestId('@fee-rate/value');
        this.feeRateChanged = this.container.getByTestId('@modal/header/fee-rate-changed');
        this.broadcast = this.container.getByTestId('@modal/header/broadcast');
        this.broadcastState = this.container.getByTestId('@modal/header/broadcast/state');
        this.nonce = this.container.getByTestId('@modal/header/nonce');
        this.nonceValue = this.container.getByTestId('@modal/header/nonce/value');
        this.gasLimit = this.container.getByTestId('@modal/header/gas-limit');
        this.gasLimitValue = this.container.getByTestId('@modal/header/gas-limit/value');
        this.feePerGas = this.container.getByTestId('@modal/header/fee-per-gas');
        this.feePerGasRate = this.feePerGas.getByTestId('@fee-rate');
        this.feePerGasValue = this.feePerGas.getByTestId('@fee-rate/value');
        this.priorityFee = this.container.getByTestId('@modal/header/priority-fee');
        this.priorityFeeRate = this.priorityFee.getByTestId('@fee-rate');
        this.priorityFeeValue = this.priorityFee.getByTestId('@fee-rate/value');
        this.tronBurned = this.container.getByTestId('@modal/header/tron-burned');
        this.tronBandwidth = this.container.getByTestId('@modal/header/tron-bandwidth');
        this.tronEnergy = this.container.getByTestId('@modal/header/tron-energy');
        this.computeUnitLimitValue = this.container.getByTestId('@modal/header/cu-limit/value');
        this.computeUnitPriceValue = this.container
            .getByTestId('@modal/header/cu-price')
            .getByTestId('@fee-rate/value');
        this.connectSource = this.container.getByTestId('@modal/header/connect-source');
        this.timer = this.container.getByTestId('@modal/header/timer');
        this.tryAgainButton = this.container.getByTestId('@modal/header/try-again-button');
        this.detailsButton = this.container.getByTestId('@modal/header/details-button');
    }
}
