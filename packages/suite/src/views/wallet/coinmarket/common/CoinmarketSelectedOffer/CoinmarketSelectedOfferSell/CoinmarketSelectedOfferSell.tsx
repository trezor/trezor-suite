import { Fragment } from 'react';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeSellType } from 'src/types/coinmarket/coinmarket';
import CoinmarketSelectedOfferBankAccount from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferSell/CoinmarketSelectedOfferSellBankAccount';
import CoinmarketSelectedOfferSellTransaction from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferSell/CoinmarketSelectedOfferSellTransaction';
import {
    CoinmarketSelectedOfferStepper,
    CoinmarketSelectedOfferStepperItemProps,
} from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferStepper';

const CoinmarketSelectedOfferSell = () => {
    const { sellStep } = useCoinmarketFormContext<CoinmarketTradeSellType>();

    const steps: (CoinmarketSelectedOfferStepperItemProps & {
        component: JSX.Element | null;
    })[] = [
        {
            step: 'BANK_ACCOUNT',
            translationId: 'TR_SELL_BANK_ACCOUNT_STEP',
            isActive: sellStep === 'BANK_ACCOUNT',
            component: <CoinmarketSelectedOfferBankAccount />,
        },
        {
            step: 'SEND_TRANSACTION',
            translationId: 'TR_SELL_CONFIRM_SEND_STEP',
            isActive: sellStep === 'SEND_TRANSACTION',
            component: <CoinmarketSelectedOfferSellTransaction />,
        },
    ];

    return (
        <>
            <CoinmarketSelectedOfferStepper steps={steps} />
            {steps.map((step, index) => (
                <Fragment key={index}>{step.isActive && step.component}</Fragment>
            ))}
        </>
    );
};

export default CoinmarketSelectedOfferSell;
