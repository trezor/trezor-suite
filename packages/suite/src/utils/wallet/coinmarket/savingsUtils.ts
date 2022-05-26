import type {
    PaymentFrequency,
    SavingsProviderInfo,
    SavingsTradeItemStatus,
} from '@suite-services/invityAPI';
import {
    CustomPaymentAmountKey,
    PaymentFrequencyAnnualCoefficient,
} from '@wallet-constants/coinmarket/savings';
import type { CurrentFiatRates } from '@wallet-types/fiatRates';
import BigNumber from 'bignumber.js';
import type { Option } from '@wallet-types/coinmarketCommonTypes';
import { isDesktop } from '@suite-utils/env';
import { desktopApi } from '@trezor/suite-desktop-api';

export const getStatusMessage = (status: SavingsTradeItemStatus) => {
    switch (status) {
        case 'InProgress':
        case 'Pending':
            return 'TR_SAVINGS_STATUS_PENDING';
        case 'Blocked':
        case 'Cancelled':
        case 'Error':
            return 'TR_SAVINGS_STATUS_ERROR';
        case 'Completed':
            return 'TR_SAVINGS_STATUS_SUCCESS';
        default:
            return 'TR_SAVINGS_STATUS_ERROR';
    }
};

export const getFiatAmountEffective = (
    fiatAmount: string | undefined,
    customFiatAmount: string | undefined,
) => {
    if (fiatAmount === CustomPaymentAmountKey) {
        const customFiatAmountNumber = Number(customFiatAmount);
        if (
            !customFiatAmount ||
            Number.isNaN(customFiatAmountNumber) ||
            customFiatAmountNumber < 0
        ) {
            return '0';
        }
        return customFiatAmount || '0';
    }
    return fiatAmount || '0';
};

export const calculateAnnualSavings = (
    paymentFrequency?: PaymentFrequency,
    fiatAmount?: string,
    customFiatAmount?: string,
    fiatCurrency?: string,
    currentFiatRates?: CurrentFiatRates,
) => {
    let annualSavingsFiatAmount = 0;
    let annualSavingsCryptoAmount = '0';
    if (paymentFrequency && currentFiatRates && (fiatAmount || customFiatAmount) && fiatCurrency) {
        const rate = currentFiatRates.rates[fiatCurrency.toLowerCase()];
        if (rate) {
            const fiatAmountEffective = getFiatAmountEffective(fiatAmount, customFiatAmount);
            annualSavingsFiatAmount =
                Number(fiatAmountEffective) * PaymentFrequencyAnnualCoefficient[paymentFrequency];
            annualSavingsCryptoAmount = new BigNumber(annualSavingsFiatAmount)
                .dividedBy(rate)
                .decimalPlaces(8)
                .toString();
        }
    }

    return {
        annualSavingsFiatAmount,
        annualSavingsCryptoAmount,
    };
};

export const getPaymentFrequencyOptions = (selectedProvider?: SavingsProviderInfo) =>
    selectedProvider?.setupPaymentFrequencies.map(
        paymentFrequency =>
            ({
                label: paymentFrequency,
                value: paymentFrequency,
            } as Option),
    ) ?? [];

export const createReturnLink = async () => {
    const { href } = window.location;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/buy-redirect');
        return `${url}?p=${encodeURIComponent(href)}`;
    }

    return href;
};
