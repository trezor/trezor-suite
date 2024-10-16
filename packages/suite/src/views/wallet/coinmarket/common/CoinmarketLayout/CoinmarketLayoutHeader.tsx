import { IconButton, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import { goto } from 'src/actions/suite/routerActions';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useDispatch, useLayout, useSelector, useTranslation } from 'src/hooks/suite';
import type { CoinmarketContainerCommonProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketLayoutNavigationItem } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigationItem';

interface CoinmarketLayoutHeaderProps extends PropsWithChildren, CoinmarketContainerCommonProps {}

export const CoinmarketLayoutHeader = ({
    title,
    backRoute = 'wallet-index',
    children,
}: CoinmarketLayoutHeaderProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const fallbackTitle = useMemo(() => title || 'TR_NAV_BUY', [title]);

    const translatedTitle = translationString(fallbackTitle);
    const pageTitle = `Trezor Suite | ${translatedTitle}`;

    const handleBackClick = useCallback(() => {
        if (selectedAccount.status === 'loaded') {
            dispatch(
                goto(backRoute, {
                    params: {
                        symbol: selectedAccount.account.symbol,
                        accountIndex: selectedAccount.account.index,
                        accountType: selectedAccount.account.accountType,
                    },
                }),
            );

            return;
        }

        dispatch(goto(backRoute));
    }, [backRoute, selectedAccount, dispatch]);

    const CoinmarketPageHeader = useCallback(
        () => (
            <PageHeader backRoute={backRoute}>
                <Row width="100%" justifyContent="space-between" gap={spacings.md}>
                    <IconButton
                        icon="caretLeft"
                        variant="tertiary"
                        size="medium"
                        onClick={handleBackClick}
                        data-testid="@account-subpage/back"
                    />
                    <BasicName nameId={fallbackTitle} />
                    <Row flex="auto" margin={{ left: 'auto' }}>
                        <CoinmarketLayoutNavigationItem
                            route="wallet-coinmarket-transactions"
                            title="TR_COINMARKET_LAST_TRANSACTIONS"
                        />
                    </Row>
                </Row>
            </PageHeader>
        ),
        [backRoute, fallbackTitle, handleBackClick],
    );

    useLayout(pageTitle, CoinmarketPageHeader);

    if (!children) return null;

    return children;
};
