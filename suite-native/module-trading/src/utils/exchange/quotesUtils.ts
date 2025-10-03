import { CoinInfo, ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { MinimalExchangeFormProps } from '@suite-common/trading';

import { ExchangeFormType } from '../../types/exchange';
import { toCaseAwareCryptoId } from '../general/utils';

export type GetAnalyticsTradingExchangePayloadProps = {
    quote: ExchangeTrade | undefined;
    sendCoinInfo: CoinInfo | undefined;
    receiveCoinInfo: CoinInfo | undefined;
};

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
        sendCryptoSelect: { value: toCaseAwareCryptoId(sendAsset.cryptoId) },
        receiveCryptoSelect: { value: toCaseAwareCryptoId(receiveAsset.cryptoId) },
        outputs: [{ amount: sendCryptoAmount }],
    };
};
