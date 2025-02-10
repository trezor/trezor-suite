import { Fragment } from 'react';

import type { TradingExchangeType } from '@suite-common/trading';
import { Card, Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import useTradingVerifyAccount from 'src/hooks/wallet/trading/form/useTradingVerifyAccount';
import { TradingOfferExchangeProps } from 'src/types/trading/tradingForm';
import { TradingOfferExchangeSend } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSend';
import { TradingOfferExchangeSendApproval } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSendApproval';
import { TradingOfferExchangeSendSwap } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSendSwap';
import { TradingOfferExchangeSignData } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeSignData';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import {
    TradingSelectedOfferStepper,
    TradingSelectedOfferStepperItemProps,
} from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferStepper';
import { TradingVerify } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingVerify/TradingVerify';

export const TradingOfferExchange = ({
    account,
    selectedQuote,
    providers,
    type,
    quoteAmounts,
}: TradingOfferExchangeProps) => {
    const { exchangeStep } = useTradingFormContext<TradingExchangeType>();
    const cryptoId = selectedQuote?.receive;
    const tradingVerifyAccount = useTradingVerifyAccount({
        cryptoId,
        nonSuiteAccount: !selectedQuote.tags?.includes('noExternalAddress'),
    });

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
            isActive: exchangeStep === 'SEND_TRANSACTION' || exchangeStep === 'SIGN_DATA',
            component: !selectedQuote.isDex ? (
                <TradingOfferExchangeSend />
            ) : (
                <>
                    {exchangeStep === 'SIGN_DATA' ? (
                        <TradingOfferExchangeSignData />
                    ) : (
                        <TradingOfferExchangeSendSwap />
                    )}
                </>
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
