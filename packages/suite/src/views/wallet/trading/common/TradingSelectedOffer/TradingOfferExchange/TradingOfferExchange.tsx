import { Fragment } from 'react';

import { Divider, Card } from '@trezor/components';
import { spacings } from '@trezor/theme';
import type { TradingExchangeType } from '@suite-common/invity';

import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingVerify } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingVerify/TradingVerify';
import { TradingOfferExchangeProps } from 'src/types/trading/tradingForm';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import useTradingVerifyAccount from 'src/hooks/wallet/trading/form/useTradingVerifyAccount';
import {
    TradingSelectedOfferStepper,
    TradingSelectedOfferStepperItemProps,
} from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferStepper';
import { TradingOfferExchangeSend } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSend';
import { TradingOfferExchangeSendSwap } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSendSwap';
import { TradingOfferExchangeSendApproval } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSendApproval';

export const TradingOfferExchange = ({
    account,
    selectedQuote,
    providers,
    type,
    quoteAmounts,
}: TradingOfferExchangeProps) => {
    const { exchangeStep } = useTradingFormContext<TradingExchangeType>();
    const cryptoId = selectedQuote?.receive;
    const tradingVerifyAccount = useTradingVerifyAccount({ cryptoId });

    const steps: TradingSelectedOfferStepperItemProps[] = [
        {
            step: 'RECEIVING_ADDRESS',
            translationId: 'TR_EXCHANGE_VERIFY_ADDRESS_STEP',
            isActive: exchangeStep === 'RECEIVING_ADDRESS',
            component: cryptoId ? (
                <TradingVerify tradingVerifyAccount={tradingVerifyAccount} cryptoId={cryptoId} />
            ) : null,
        },
        ...((selectedQuote.isDex
            ? [
                  {
                      step: 'SEND_APPROVAL_TRANSACTION',
                      translationId: 'TR_EXCHANGE_CREATE_APPROVAL_STEP',
                      isActive: exchangeStep === 'SEND_APPROVAL_TRANSACTION',
                      component: <TradingOfferExchangeSendApproval />,
                  },
              ]
            : []) as TradingSelectedOfferStepperItemProps[]),
        {
            step: 'SEND_TRANSACTION',
            translationId: 'TR_EXCHANGE_CONFIRM_SEND_STEP',
            isActive: exchangeStep === 'SEND_TRANSACTION',
            component: !selectedQuote.isDex ? (
                <TradingOfferExchangeSend />
            ) : (
                <TradingOfferExchangeSendSwap />
            ),
        },
    ];

    return (
        <>
            <Card>
                <TradingSelectedOfferStepper steps={steps} />
                <Divider margin={{ top: spacings.lg, bottom: spacings.xl }} />
                {steps.map((step, index) => (
                    <Fragment key={index}>{step.isActive && step.component}</Fragment>
                ))}
            </Card>
            <Card>
                <TradingSelectedOfferInfo
                    account={account}
                    selectedAccount={tradingVerifyAccount.selectedAccountOption?.account}
                    selectedQuote={selectedQuote}
                    providers={providers}
                    type={type}
                    quoteAmounts={quoteAmounts}
                />
            </Card>
        </>
    );
};
