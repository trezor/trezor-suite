import { Fragment } from 'react';

import {
    selectTradingExchangeFormStep,
    selectTradingExchangeReceiveAccountKey,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { TradingOfferExchangeProps } from 'src/types/trading/tradingForm';
import { TradingOfferExchangeSend } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSend';
import { TradingOfferExchangeSendSwap } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSendSwap';
import { TradingOfferExchangeSignData } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSignData';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';

export const TradingOfferExchange = ({
    account,
    selectedQuote,
    providers,
    type,
    quoteAmounts,
}: TradingOfferExchangeProps) => {
    const formStep = useSelector(selectTradingExchangeFormStep);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const receiveAccount = useSelector(
        state => selectAccountByKey(state, receiveAccountKey) ?? undefined,
    );

    return (
        <>
            <Card>
                <Fragment>
                    {!selectedQuote.isDex ? (
                        <TradingOfferExchangeSend />
                    ) : (
                        <>
                            {formStep === 'SEND_TRANSACTION' && <TradingOfferExchangeSendSwap />}

                            {formStep === 'SIGN_DATA' && <TradingOfferExchangeSignData />}
                        </>
                    )}
                </Fragment>
            </Card>
            <Card paddingType="large">
                <TradingSelectedOfferInfo
                    formStep={formStep}
                    account={account}
                    selectedAccount={receiveAccount}
                    selectedQuote={selectedQuote}
                    providers={providers}
                    type={type}
                    quoteAmounts={quoteAmounts}
                />
            </Card>
        </>
    );
};
