import type { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import type { MinimalExchangeFormProps } from '@suite-common/trading';
import { toCaseAwareCryptoId } from '@suite-native/trading-atoms';
import type { ExchangeFormType } from '@suite-native/trading-types';

export const tradingExchangeFormToTradingExchangeFormProps = (
    getValues: ExchangeFormType['getValues'],
): MinimalExchangeFormProps => {
    const [sendAsset, receiveAsset, sendCryptoAmount] = getValues([
        'sendAsset',
        'receiveAsset',
        'sendCryptoAmount',
    ]);

    invariant(sendAsset, 'sendAsset is required');
    invariant(receiveAsset, 'receiveAsset is required');
    invariant(sendCryptoAmount, 'sendCryptoAmount is required');

    return {
        sendCryptoSelect: { id: toCaseAwareCryptoId(sendAsset.cryptoId) },
        receiveCryptoSelect: { id: toCaseAwareCryptoId(receiveAsset.cryptoId) },
        outputs: [{ amount: sendCryptoAmount }],
    };
};

export const hasPreapprovedLimit = (quote: ExchangeTrade | undefined): boolean =>
    !!quote?.preapprovedStringAmount && quote.preapprovedStringAmount !== '0';
