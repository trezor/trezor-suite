import { Fragment } from 'react';

import type { TradingSellType } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Card, Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
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
    const accounts = useSelector(selectAccounts);
    const { sellStep, trade } = useTradingFormContext<TradingSellType>();

    const sendAccount = accounts.find(account => account.key === trade?.sendAccountKey);

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
                <TradingSelectedOfferInfo {...props} selectedAccount={sendAccount} />
            </Card>
        </>
    );
};
