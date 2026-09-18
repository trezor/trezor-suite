import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { Form } from '@suite/form';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/sell/useTradingSellForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';
import { TradingSellFormInputs } from '../common/TradingForm/TradingSellFormInputs';

const TradingSellFormWrapper = () => {
    const tradingSellContextValues = useTradingSellForm();

    const { formState } = tradingSellContextValues.methods;

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <Form form={tradingSellContextValues.methods} formState={formState}>
                <TradingContainer>
                    <TradingFormLayout>
                        <TradingSellFormInputs />
                    </TradingFormLayout>
                </TradingContainer>
            </Form>
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
