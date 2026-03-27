import { invariant } from '@suite-common/suite-utils';
import { type MinimalSellFormProps } from '@suite-common/trading';
import { type SellFormType } from '@suite-native/trading-types';
import { type BaseCurrencyCode, isBaseCurrencyCode } from '@trezor/blockchain-link-types';

export const tradingSellFormToTradingSellFormProps = (
    getValues: SellFormType['getValues'],
): MinimalSellFormProps => {
    const [amountInCrypto, fiatStringAmount, cryptoStringAmount, fiatCurrency, sendAsset, country] =
        getValues([
            'amountInCrypto',
            'fiatStringAmount',
            'cryptoStringAmount',
            'fiatCurrency',
            'sendAsset',
            'country',
        ]);

    invariant(sendAsset, 'sendAsset is required');
    invariant(!amountInCrypto || cryptoStringAmount, 'cryptoStringAmount is required');
    invariant(amountInCrypto || fiatStringAmount, 'fiatStringAmount is required');

    const fiatCurrencyCode = typeof fiatCurrency === 'string' ? fiatCurrency : '';
    const baseCurrencyCode: BaseCurrencyCode = isBaseCurrencyCode(fiatCurrencyCode)
        ? fiatCurrencyCode
        : 'usd';

    const outputs = [
        {
            amount: amountInCrypto ? cryptoStringAmount : undefined,
            fiat: amountInCrypto ? undefined : fiatStringAmount,
            currency: { value: baseCurrencyCode },
        },
    ];

    return {
        outputs,
        amountInCrypto,
        countrySelect: country,
        sendCryptoSelect: { id: sendAsset.cryptoId },
    };
};
