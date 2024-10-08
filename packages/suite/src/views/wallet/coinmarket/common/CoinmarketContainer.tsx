import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { ComponentType } from 'react';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { WalletLayout } from 'src/components/wallet';
import { useLayout, useSelector, useTranslation } from 'src/hooks/suite';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common/CoinmarketFooter/CoinmarketFooter';

interface CoinmarketContainerProps {
    title?: Extract<
        ExtendedMessageDescriptor['id'],
        | 'TR_NAV_BUY'
        | 'TR_NAV_SELL'
        | 'TR_NAV_DCA'
        | 'TR_COINMARKET_SWAP'
        | 'TR_COINMARKET_LAST_TRANSACTIONS'
    >;
    backRoute?: Extract<Route['name'], `wallet-coinmarket-${string}`>;
    SectionComponent: ComponentType<UseCoinmarketProps>;
}

export const CoinmarketContainer = ({
    backRoute,
    title,
    SectionComponent,
}: CoinmarketContainerProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { translationString } = useTranslation();

    const translatedTitle = translationString(title ?? 'TR_NAV_TRADE');
    const pageTitle = `Trezor Suite | ${translatedTitle}`;

    useLayout(pageTitle, () => <PageHeader backRoute={backRoute} />);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_TRADE" isSubpage account={selectedAccount} />;
    }

    return (
        <>
            <SectionComponent selectedAccount={selectedAccount} />
            <CoinmarketFooter />
        </>
    );
};
