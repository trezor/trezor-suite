import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { ComponentType } from 'react';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { WalletLayout } from 'src/components/wallet';
import { useLayout, useSelector, useTranslation } from 'src/hooks/suite';
import { selectRouter } from 'src/reducers/suite/routerReducer';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common/CoinmarketFooter/CoinmarketFooter';
import { CoinmarketLayoutHeader } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutHeader';

export interface CoinmarketContainerProps extends CoinmarketContainerCommonProps {
    SectionComponent: ComponentType<UseCoinmarketProps>;
}

export const CoinmarketContainer = ({
    backRoute,
    title,
    SectionComponent,
}: CoinmarketContainerProps) => {
    const { translationString } = useTranslation();
    const router = useSelector(selectRouter);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const suiteBackRouteName = useSelector(state => state.wallet.coinmarket.suiteBackRouteName);

    const currentRouteName = router.route?.name;
    const currentBackRouteName = router.settingsBackRoute.name;
    const fallbackBackRoute =
        currentRouteName &&
        [
            'wallet-coinmarket-buy',
            'wallet-coinmarket-sell',
            'wallet-coinmarket-exchange',
            'wallet-coinmarket-dca',
        ].includes(currentRouteName)
            ? suiteBackRouteName
            : currentBackRouteName;

    const translatedTitle = translationString(title ?? 'TR_NAV_TRADE');
    const pageTitle = `Trezor Suite | ${translatedTitle}`;

    useLayout(pageTitle, () => <PageHeader backRoute={backRoute ?? fallbackBackRoute} />);

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
