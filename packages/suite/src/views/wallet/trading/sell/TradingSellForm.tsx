import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { selectIsDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingSellContextProvider } from './TradingSellContext';
import { TradingDisabled } from '../common/TradingDisabled';
import { TradingSellFormInputs } from '../common/TradingForm/TradingSellFormInputs';

const TradingSellFormContent = () => (
    <TradingFormLayout>
        <TradingSellFormInputs />
    </TradingFormLayout>
);

const TradingSellFormWrapper = () => {
    const tradingSellContextValues = useTradingSellForm({});

    return (
        <TradingSellContextProvider value={tradingSellContextValues}>
            <FormProvider {...tradingSellContextValues.methods}>
                <TradingContainer SectionComponent={TradingSellFormContent} />
            </FormProvider>
        </TradingSellContextProvider>
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
