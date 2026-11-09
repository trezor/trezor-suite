import type { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { type MinimalExchangeFormProps, getExchangeFromAddress } from '@suite-common/trading';
import { toCaseAwareCryptoId } from '@suite-native/trading-atoms';
import type { ExchangeFormType } from '@suite-native/trading-types';

import { getReceiveAccountAddressText } from '../general/receiveAccountUtils';

export const tradingExchangeFormToTradingExchangeFormProps = (
    getValues: ExchangeFormType['getValues'],
): MinimalExchangeFormProps => {
    const [sendAccount, sendAsset, receiveAsset, sendCryptoAmount, receiveAccount] = getValues([
        'sendAccount',
        'sendAsset',
        'receiveAsset',
        'sendCryptoAmount',
        'receiveAccount',
    ]);

    invariant(sendAsset, 'sendAsset is required');
    invariant(receiveAsset, 'receiveAsset is required');
    invariant(sendCryptoAmount, 'sendCryptoAmount is required');

    return {
        sendCryptoSelect: { id: toCaseAwareCryptoId(sendAsset.cryptoId) },
        receiveCryptoSelect: { id: toCaseAwareCryptoId(receiveAsset.cryptoId) },
        outputs: [{ amount: sendCryptoAmount }],
        fromAddress: getExchangeFromAddress(sendAccount),
        receiveAddress: getReceiveAccountAddressText(receiveAccount),
        receiveAccountKey: receiveAccount?.account.key,
    };
};

export const hasPreapprovedLimit = (quote: ExchangeTrade | undefined): boolean =>
    !!quote?.preapprovedStringAmount && quote.preapprovedStringAmount !== '0';
