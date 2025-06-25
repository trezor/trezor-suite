import { invariant } from '@suite-common/suite-utils';
import { MinimalExchangeFormProps } from '@suite-common/trading';

import { ExchangeFormType } from '../../types/exchange';

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
        sendCryptoSelect: { value: sendAsset.cryptoId },
        receiveCryptoSelect: { value: receiveAsset.cryptoId },
        outputs: [{ amount: sendCryptoAmount }],
    };
};
