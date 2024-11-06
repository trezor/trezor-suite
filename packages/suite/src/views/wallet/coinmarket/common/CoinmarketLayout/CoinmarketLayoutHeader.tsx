import { PropsWithChildren, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { IconButton, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout, useSelector, useTranslation } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { CoinmarketLayoutNavigationItem } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigationItem';

interface CoinmarketLayoutHeaderProps extends PropsWithChildren {}

export const CoinmarketLayoutHeader = ({ children }: CoinmarketLayoutHeaderProps) => {
    const currentRouteName = useSelector(selectRouteName);
    const { activeSection } = useSelector(state => state.wallet.coinmarket);
    const { goBack } = useHistory();
    const { translationString } = useTranslation();
    const fallbackTitle = useMemo(
        () => (activeSection === 'exchange' ? 'TR_COINMARKET_SWAP' : 'TR_COINMARKET_BUY_AND_SELL'),
        [activeSection],
    );

    const translatedTitle = translationString(fallbackTitle);
    const pageTitle = `Trezor Suite | ${translatedTitle}`;

    const CoinmarketPageHeader = useCallback(
        () => (
            <PageHeader>
                <Row width="100%" gap={spacings.md}>
                    <IconButton
                        icon="caretLeft"
                        variant="tertiary"
                        size="medium"
                        onClick={goBack}
                        data-testid="@account-subpage/back"
                    />
                    <BasicName nameId={fallbackTitle} />
                    {currentRouteName !== 'wallet-coinmarket-transactions' && (
                        <Row flex="auto" margin={{ left: 'auto' }}>
                            <CoinmarketLayoutNavigationItem
                                route="wallet-coinmarket-transactions"
                                title="TR_COINMARKET_LAST_TRANSACTIONS"
                            />
                        </Row>
                    )}
                </Row>
            </PageHeader>
        ),
        [fallbackTitle, currentRouteName, goBack],
    );

    useLayout(pageTitle, CoinmarketPageHeader);

    if (!children) return null;

    return children;
};
