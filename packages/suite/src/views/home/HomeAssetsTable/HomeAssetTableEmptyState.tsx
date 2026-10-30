import { events, injectDesktopAnalytics } from '@suite/analytics';
import { selectIsFinpromRestricted } from '@suite/finprom';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { Button, Card, Column, H3, Illustration, Paragraph, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowDownIcon, PlusIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const HomeAssetTableEmptyState = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const isFinpromRestricted = useSelector(selectIsFinpromRestricted);

    const handleReceive = () => {
        analytics.report({
            type: events.dashboardReceiveModalEvent.name,
            payload: { source: 'empty-wallet' },
        });
        dispatch(gotoThunk({ routeName: 'suite-index', params: { modal: 'receive' } }));
    };

    const handleBuy = () => {
        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'dashboard/empty-wallet',
            },
        });
        dispatch(gotoThunk({ routeName: 'wallet-trading-buy' }));
    };

    return (
        <Card data-testid="@dashboard/home-asset-table/empty">
            <Column gap={4} alignItems="center" padding={{ vertical: 24 }}>
                <Illustration name="assetsGet" width={160} />
                <H3 margin={{ top: 16 }}>
                    <Translation id="TR_HOME_ASSET_EMPTY_TITLE" />
                </H3>
                <Paragraph
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-md"
                    maxWidth={500}
                    align="center"
                >
                    <Translation id="TR_HOME_ASSET_EMPTY_DESCRIPTION" />
                </Paragraph>
                <Row gap={12} margin={{ top: 16 }}>
                    {!isFinpromRestricted && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft={PlusIcon}
                            size="medium"
                            onClick={handleBuy}
                            data-testid="@dashboard/home-asset-table/empty/buy"
                        >
                            <Translation id="TR_BUY" />
                        </Button>
                    )}
                    <Button
                        intent="brand"
                        iconLeft={ArrowDownIcon}
                        size="medium"
                        onClick={handleReceive}
                        data-testid="@dashboard/home-asset-table/empty/receive"
                    >
                        <Translation id="TR_NAV_RECEIVE" />
                    </Button>
                </Row>
            </Column>
        </Card>
    );
};
