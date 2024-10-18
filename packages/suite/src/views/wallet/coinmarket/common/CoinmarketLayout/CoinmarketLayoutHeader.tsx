import { IconButton, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import { goto } from 'src/actions/suite/routerActions';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useDispatch, useLayout, useSelector, useTranslation } from 'src/hooks/suite';
import { selectRouter } from 'src/reducers/suite/routerReducer';
import type { CoinmarketContainerCommonProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketLayoutNavigationItem } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigationItem';

interface CoinmarketLayoutHeaderProps extends PropsWithChildren, CoinmarketContainerCommonProps {}

export const CoinmarketLayoutHeader = ({
    title,
    backRoute,
    children,
}: CoinmarketLayoutHeaderProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const router = useSelector(selectRouter);
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

    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const fallbackTitle = useMemo(() => title || 'TR_NAV_TRADE', [title]);
    const transactionPageTitle = 'TR_COINMARKET_LAST_TRANSACTIONS';

    const translatedTitle = translationString(fallbackTitle);
    const pageTitle = `Trezor Suite | ${translatedTitle}`;
    const newBackRoute = backRoute || fallbackBackRoute;

    const handleBackClick = useCallback(() => {
        if (selectedAccount.status === 'loaded') {
            dispatch(
                goto(newBackRoute, {
                    params: {
                        symbol: selectedAccount.account.symbol,
                        accountIndex: selectedAccount.account.index,
                        accountType: selectedAccount.account.accountType,
                    },
                }),
            );

            return;
        }

        dispatch(goto(newBackRoute));
    }, [newBackRoute, selectedAccount, dispatch]);

    const CoinmarketPageHeader = useCallback(
        () => (
            <PageHeader backRoute={newBackRoute}>
                <Row width="100%" gap={spacings.md}>
                    <IconButton
                        icon="caretLeft"
                        variant="tertiary"
                        size="medium"
                        onClick={handleBackClick}
                        data-testid="@account-subpage/back"
                    />
                    <BasicName nameId={fallbackTitle} />
                    {title !== transactionPageTitle && (
                        <Row flex="auto" margin={{ left: 'auto' }}>
                            <CoinmarketLayoutNavigationItem
                                route="wallet-coinmarket-transactions"
                                title={transactionPageTitle}
                            />
                        </Row>
                    )}
                </Row>
            </PageHeader>
        ),
        [newBackRoute, fallbackTitle, title, handleBackClick],
    );

    useLayout(pageTitle, CoinmarketPageHeader);

    if (!children) return null;

    return children;
};
