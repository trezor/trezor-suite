import { ElementType } from 'react';

import { useSelector } from 'src/hooks/suite';
import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { TradingLayoutHeader } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutHeader';

export interface TradingContainerProps {
    SectionComponent: ElementType;
}

export const TradingContainer = ({ SectionComponent }: TradingContainerProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <TradingLayoutHeader />;
    }

    return (
        <TradingLayoutHeader>
            <SectionComponent selectedAccount={selectedAccount} />
            <TradingFooter />
        </TradingLayoutHeader>
    );
};
