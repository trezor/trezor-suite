import { FormProvider } from 'react-hook-form';

import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { useSelector } from '@suite-common/redux-utils';
import { type TradingType } from '@suite-common/trading';

import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/buy/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';
import { TradingBuyFormInputs } from '../common/TradingForm/TradingBuyFormInputs';

const TradingBuyFormWrapper = () => {
    const tradingBuyContextValues = useTradingBuyForm();

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <FormProvider {...tradingBuyContextValues.methods}>
                <TradingContainer>
                    <TradingFormLayout>
                        <TradingBuyFormInputs />
                    </TradingFormLayout>
                </TradingContainer>
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

export const TradingBuyForm = () => {
    const type: TradingType = 'buy';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingBuyFormWrapper />
            )}
        </TradingLayout>
    );
};
