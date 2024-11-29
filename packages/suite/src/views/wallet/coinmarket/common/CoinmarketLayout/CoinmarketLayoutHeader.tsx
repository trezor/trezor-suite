import { PropsWithChildren, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { IconButton, Row, Box } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout, useSelector, useTranslation } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { CoinmarketLayoutNavigationItem } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigationItem';
import { TranslationKey } from 'src/components/suite/Translation';

interface CoinmarketLayoutHeaderProps extends PropsWithChildren {}

type CoinmarketPageHeaderProps = {
    fallbackTitle: TranslationKey;
    currentRouteName?: string;
    goBack: () => void;
};

const CoinmarketPageHeader = ({
    fallbackTitle,
    currentRouteName,
    goBack,
}: CoinmarketPageHeaderProps) => {
    return (
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
                    <Box margin={{ left: 'auto' }}>
                        <CoinmarketLayoutNavigationItem
                            route="wallet-coinmarket-transactions"
                            title="TR_COINMARKET_LAST_TRANSACTIONS"
                        />
                    </Box>
                )}
            </Row>
        </PageHeader>
    );
};

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

    useLayout(
        pageTitle,
        <CoinmarketPageHeader
            fallbackTitle={fallbackTitle}
            currentRouteName={currentRouteName}
            goBack={goBack}
        />,
    );

    if (!children) return null;

    return children;
};
