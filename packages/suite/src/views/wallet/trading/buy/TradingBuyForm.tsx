import { Context } from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';

const TradingBuyFormContent = ({ selectedAccount }: UseTradingProps) => {
    const tradingBuyContextValues = useTradingBuyForm({ selectedAccount });

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <TradingFormLayout />
        </TradingFormContext.Provider>
    );
};

const TradingBuyFormWrapper = ({ selectedAccount }: UseTradingProps) => {
    const type: TradingType = 'buy';
    const { isDisabled, content } = useMessageSystemTrading(type);

    return (
        <TradingLayout>
            <ContextMessage context={Context.tradingBuy} />
            {isDisabled ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingBuyFormContent selectedAccount={selectedAccount} />
            )}
        </TradingLayout>
    );
};

export const TradingBuyForm = () => <TradingContainer SectionComponent={TradingBuyFormWrapper} />;
