import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectIsDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';
import { TradingBuyFormInputs } from '../common/TradingForm/TradingBuyFormInputs';

export const TradingBuyFormContent = () => (
    <TradingFormLayout>
        <TradingBuyFormInputs />
    </TradingFormLayout>
);

const TradingBuyFormWrapper = () => {
    const tradingBuyContextValues = useTradingBuyForm();

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <FormProvider {...tradingBuyContextValues.methods}>
                <TradingContainer SectionComponent={TradingBuyFormContent} />
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
