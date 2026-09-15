import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { Form } from '@suite/form';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
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

    const { formState } = tradingBuyContextValues.methods;

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <Form form={tradingBuyContextValues.methods} formState={formState}>
                <TradingContainer>
                    <TradingFormLayout>
                        <TradingBuyFormInputs />
                    </TradingFormLayout>
                </TradingContainer>
            </Form>
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
