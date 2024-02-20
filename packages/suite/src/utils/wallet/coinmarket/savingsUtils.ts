import type { PaymentFrequency, SavingsProviderInfo, SavingsTradeItemStatus } from 'invity-api';
import {
    CustomPaymentAmountKey,
    PaymentFrequencyAnnualCoefficient,
} from 'src/constants/wallet/coinmarket/savings';
import type { CurrentFiatRates } from 'src/types/wallet/fiatRates';
import BigNumber from 'bignumber.js';
import type { PaymentFrequencyOption } from 'src/types/wallet/coinmarketCommonTypes';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Translation } from 'src/components/suite/Translation';
import type { PaymentFrequencyTranslationId } from 'src/types/wallet/coinmarketSavingsSetup';

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

const paymentFrequencyTranslationsIds: Record<PaymentFrequency, PaymentFrequencyTranslationId> = {
    Daily: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_DAILY',
    Biweekly: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_BIWEEKLY',
    Weekly: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_WEEKLY',
    Monthly: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_MONTHLY',
    Quarterly: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_QUARTERLY',
};
export const getPaymentFrequencyOptions = (selectedProvider?: SavingsProviderInfo) =>
    selectedProvider?.setupPaymentFrequencies.map(
        paymentFrequency =>
            ({
                label: Translation({ id: paymentFrequencyTranslationsIds[paymentFrequency] }),
                value: paymentFrequency,
            }) as PaymentFrequencyOption,
    ) ?? [];

export const createReturnLink = async () => {
    const { href } = window.location;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/buy-redirect');

        return `${url}?p=${encodeURIComponent(href)}`;
    }

    return href;
};
