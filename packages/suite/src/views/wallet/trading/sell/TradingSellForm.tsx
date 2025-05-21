import { Context } from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';

const TradingSellFormContent = ({ selectedAccount }: UseTradingProps) => {
    const tradingSellContextValues = useTradingSellForm({ selectedAccount });

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <TradingFormLayout />
        </TradingFormContext.Provider>
    );
};

const TradingSellFormWrapper = ({ selectedAccount }: UseTradingProps) => {
    const type: TradingType = 'sell';
    const { isDisabled, content } = useMessageSystemTrading(type);

    return (
        <TradingLayout>
            <ContextMessage context={Context.tradingSell} />
            {isDisabled ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingSellFormContent selectedAccount={selectedAccount} />
            )}
        </TradingLayout>
    );
};

export const TradingSellForm = () => <TradingContainer SectionComponent={TradingSellFormWrapper} />;
