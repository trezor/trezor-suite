import { ElementType } from 'react';
import { useSelector } from 'src/hooks/suite';
import { CoinmarketContainerCommonProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common/CoinmarketFooter/CoinmarketFooter';
import { CoinmarketLayoutHeader } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutHeader';

export interface CoinmarketContainerProps extends CoinmarketContainerCommonProps {
    SectionComponent: ElementType;
}

export const CoinmarketContainer = ({
    backRoute,
    title,
    SectionComponent,
}: CoinmarketContainerProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <CoinmarketLayoutHeader title={title} backRoute={backRoute} />;
    }

    return (
        <CoinmarketLayoutHeader title={title} backRoute={backRoute}>
            <SectionComponent selectedAccount={selectedAccount} />
            <CoinmarketFooter />
        </CoinmarketLayoutHeader>
    );
};
