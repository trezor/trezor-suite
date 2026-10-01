import { getNetwork } from '@suite-common/wallet-config';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { MAX_CRYPTO_DECIMALS } from '@suite-native/trading-consts';
import type { BuyFormType, TradeableAsset } from '@suite-native/trading-types';

type BuyFormAmountSetters = Pick<BuyFormType, 'getValues' | 'setValue'>;

// The other amounts are filled from quotes requested by the crypto amount.
export const syncBuyAmountsAfterCryptoChange = ({ getValues, setValue }: BuyFormAmountSetters) => {
    setValue('fiatValue', undefined, { shouldValidate: true });
    setValue('cryptoBaseCurrencyValue', undefined);

    if (!getValues('amountInCrypto')) {
        setValue('amountInCrypto', true);
    }
};

// The crypto amount is filled from quotes requested by the fiat amount.
export const syncBuyAmountsAfterFiatChange = ({ getValues, setValue }: BuyFormAmountSetters) => {
    setValue('cryptoValue', undefined, { shouldValidate: true });
    setValue('cryptoBaseCurrencyValue', undefined);

    if (getValues('amountInCrypto')) {
        setValue('amountInCrypto', false);
    }
};

export const setBuyCryptoValue = (form: BuyFormAmountSetters, cryptoValue: string | undefined) => {
    form.setValue('cryptoValue', cryptoValue, { shouldValidate: true });
    syncBuyAmountsAfterCryptoChange(form);
};

export const getBuyCryptoValueDecimals = (
    asset: TradeableAsset | undefined,
): number | undefined => {
    const symbol = getSymbolFromTradeableAsset(asset);

    if (!asset || !symbol) {
        return undefined;
    }

    return Math.min(asset.decimals ?? getNetwork(symbol).decimals, MAX_CRYPTO_DECIMALS);
};
