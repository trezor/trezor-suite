import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { selectIsDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';
import { TradingSellFormInputs } from '../common/TradingForm/TradingSellFormInputs';

const TradingSellFormContent = () => (
    <TradingFormLayout>
        <TradingSellFormInputs />
    </TradingFormLayout>
);

const TradingSellFormWrapper = ({ selectedAccount }: UseTradingProps) => {
    const tradingSellContextValues = useTradingSellForm({ selectedAccount });

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <FormProvider {...tradingSellContextValues.methods}>
                <TradingContainer SectionComponent={TradingSellFormContent} />
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

const TradingSellFormLoaded = ({ selectedAccount }: UseTradingProps) => {
    const type: TradingType = 'sell';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingSellFormWrapper selectedAccount={selectedAccount} />
            )}
        </TradingLayout>
    );
};

export const TradingSellForm = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    return <TradingSellFormLoaded selectedAccount={selectedAccount} />;
};
