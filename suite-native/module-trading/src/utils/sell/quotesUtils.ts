import { invariant } from '@suite-common/suite-utils';
import { MinimalSellFormProps } from '@suite-common/trading';
import { SellFormType } from '@suite-native/trading-types';

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

    const outputs = [
        {
            amount: amountInCrypto ? cryptoStringAmount : undefined,
            fiat: amountInCrypto ? undefined : fiatStringAmount,
            currency: { value: fiatCurrency },
        },
    ];

    return {
        outputs,
        amountInCrypto,
        countrySelect: country,
        sendCryptoSelect: { id: sendAsset.cryptoId },
    };
};
