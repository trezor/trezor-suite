import { useMemo } from 'react';
import styled from 'styled-components';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { selectIsOnboardingFeedbackBannerShown, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectNetworkNamesMap } from '@suite-common/networks/reduxState/networksSelectors';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { Box, Button, Column, H3, Illustration, Paragraph, Row } from '@trezor/components';
import { ArrowDownIcon, CurrencyCircleDollarIcon } from '@trezor/icons';
import { NetworkIconSet } from '@trezor/product-components/src/components/NetworkIconSet/NetworkIconSet';
import { TokenIcon } from '@trezor/product-components/src/components/TokenIcon/TokenIcon';

import { useSelector } from 'src/hooks/suite';

const NETWORK_ICON_SIZE = 20;

const RoundedBorder = styled.div`
    padding: 4px 6px 4px 12px;
    border: dashed 1px ${({ theme }) => theme.elementBorderField};
    border-radius: calc(infinity * 1px);
`;

export const EmptyWallet = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const networkNamesMap = useSelector(selectNetworkNamesMap);
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isOnboardingFeedbackBannerShown = useSelector(selectIsOnboardingFeedbackBannerShown);

    const networks = useMemo(
        () =>
            enabledNetworks.map(symbol => ({
                symbol,
                name: networkNamesMap?.[symbol] ?? symbol,
                icon: <TokenIcon symbol={symbol} size={NETWORK_ICON_SIZE} />,
            })),
        [enabledNetworks, networkNamesMap],
    );

    const clearOnboardingFeedbackBanner = () => {
        if (isOnboardingFeedbackBannerShown) {
            dispatch(setFlag({ key: 'showOnboardingFeedbackBanner', value: false }));
        }
    };

    const handleReceive = () => {
        clearOnboardingFeedbackBanner();
        analytics.report({
            type: events.dashboardReceiveModalEvent.name,
            payload: { source: 'empty-wallet' },
        });
        dispatch(gotoThunk({ routeName: 'suite-index', params: { modal: 'receive' } }));
    };

    const handleBuy = () => {
        clearOnboardingFeedbackBanner();
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
        <Column gap={4} data-testid="@dashboard/wallet-ready" alignItems="center">
            <Illustration name="assetsGet" width={224} />
            <H3 margin={{ top: 16 }}>
                <Translation id="TR_YOUR_WALLET_IS_READY_WHAT" />
            </H3>
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-md"
                maxWidth={500}
                align="center"
            >
                <Translation id="TR_DASHBOARD_EMPTY_WALLET_DESC" />
            </Paragraph>
            {enabledNetworks.length > 0 && !isBitcoinOnlyFirmware && (
                <RoundedBorder>
                    <Row gap={8} flexWrap="wrap">
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            <Translation id="TR_READY_ON" />:
                        </Paragraph>
                        <Box height={NETWORK_ICON_SIZE}>
                            <NetworkIconSet
                                networks={networks}
                                size={NETWORK_ICON_SIZE}
                                gap={16}
                                maxVisibleIcons={null}
                                hasTooltip
                            />
                        </Box>
                    </Row>
                </RoundedBorder>
            )}
            <Row gap={12} margin={{ top: 16 }}>
                <Button
                    intent="brand"
                    iconLeft={CurrencyCircleDollarIcon}
                    size="medium"
                    onClick={handleBuy}
                    data-testid="@dashboard/empty-wallet/buy"
                >
                    <Translation id="TR_BUY" />
                </Button>
                <Button
                    intent="brand"
                    iconLeft={ArrowDownIcon}
                    size="medium"
                    onClick={handleReceive}
                    data-testid="@dashboard/empty-wallet/receive"
                >
                    <Translation id="TR_NAV_RECEIVE" />
                </Button>
            </Row>
        </Column>
    );
};
