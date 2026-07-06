import { FormProvider } from 'react-hook-form';

import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';
import { TradingSellFormInputs } from '../common/TradingForm/TradingSellFormInputs';

const TradingSellFormWrapper = () => {
    const tradingSellContextValues = useTradingSellForm();

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <FormProvider {...tradingSellContextValues.methods}>
                <TradingContainer>
                    <TradingFormLayout>
                        <TradingSellFormInputs />
                    </TradingFormLayout>
                </TradingContainer>
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

export const TradingSellForm = () => {
    const type: TradingType = 'sell';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingSellFormWrapper />
            )}
        </TradingLayout>
    );
};
