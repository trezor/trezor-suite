import { ElementType } from 'react';

import { useSelector } from 'src/hooks/suite';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common/CoinmarketFooter/CoinmarketFooter';
import { CoinmarketLayoutHeader } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutHeader';

export interface CoinmarketContainerProps {
    SectionComponent: ElementType;
}

export const CoinmarketContainer = ({ SectionComponent }: CoinmarketContainerProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <CoinmarketLayoutHeader />;
    }

    return (
        <CoinmarketLayoutHeader>
            <SectionComponent selectedAccount={selectedAccount} />
            <CoinmarketFooter />
        </CoinmarketLayoutHeader>
    );
};
