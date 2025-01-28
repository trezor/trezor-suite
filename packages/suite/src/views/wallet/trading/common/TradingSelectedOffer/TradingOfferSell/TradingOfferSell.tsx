import { Fragment } from 'react';

import type { TradingSellType } from '@suite-common/invity';
import { Card, Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingOfferSellProps } from 'src/types/trading/tradingForm';
import { TradingOfferSellBankAccount } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSellBankAccount';
import { TradingSelectedOfferSellTransaction } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSellTransaction';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import {
    TradingSelectedOfferStepper,
    TradingSelectedOfferStepperItemProps,
} from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferStepper';

export const TradingOfferSell = (props: TradingOfferSellProps) => {
    const { sellStep } = useTradingFormContext<TradingSellType>();

    const steps: (TradingSelectedOfferStepperItemProps & {
        component: JSX.Element | null;
    })[] = [
        {
            step: 'BANK_ACCOUNT',
            translationId: 'TR_SELL_BANK_ACCOUNT_STEP',
            isActive: sellStep === 'BANK_ACCOUNT',
            component: <TradingOfferSellBankAccount />,
        },
        {
            step: 'SEND_TRANSACTION',
            translationId: 'TR_SELL_CONFIRM_SEND_STEP',
            isActive: sellStep === 'SEND_TRANSACTION',
            component: <TradingSelectedOfferSellTransaction />,
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
                <TradingSelectedOfferInfo {...props} />
            </Card>
        </>
    );
};
