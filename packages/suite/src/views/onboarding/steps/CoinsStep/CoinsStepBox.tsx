import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { OnboardingCard, type OnboardingCardProps } from '@suite/onboarding-components';
import { selectHasExperimentalFeature } from '@suite/settings';
import { changeCoinVisibility, selectEnabledNetworks } from '@suite-common/wallet-core';
import { Badge, CollapsibleBox, Column, Row, Tooltip } from '@trezor/components';
import { isDesktop, isWeb } from '@trezor/env-utils';

import { CoinGroup } from 'src/components/suite';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getIsTorEnabled } from 'src/utils/suite/tor';

import { TorSection } from './TorSection';

export const CoinsStepBox = (props: OnboardingCardProps) => {
    const { showUnsupportedCoins, supportedMainnets, unsupportedMainnets, supportedTestnets } =
        useNetworkSupport();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const torStatus = useSelector(state => state.suite.torStatus);
    const dispatch = useDispatch();
    const isTorEnabled = getIsTorEnabled(torStatus);
    const useTestnetNetworks = useSelector(selectHasExperimentalFeature('testnet-networks'));

    // BTC should be enabled by default
    useEffect(() => {
        dispatch(changeCoinVisibility({ symbol: 'btc', shouldBeVisible: true }));
    }, [dispatch]);

    return (
        <OnboardingCard iconName="coins" {...props}>
            <Column gap={32}>
                <CoinGroup networks={supportedMainnets} enabledNetworks={enabledNetworks} />
                {useTestnetNetworks && (
                    <CollapsibleBox
                        heading={
                            <Tooltip
                                content={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                                hasIcon
                            >
                                <Translation id="TR_TESTNET_COINS" />
                            </Tooltip>
                        }
                    >
                        <CoinGroup networks={supportedTestnets} enabledNetworks={enabledNetworks} />
                    </CollapsibleBox>
                )}
                {showUnsupportedCoins && (
                    <CollapsibleBox
                        heading={
                            <Tooltip
                                content={<Translation id="TR_UNSUPPORTED_COINS_DESCRIPTION" />}
                                hasIcon
                            >
                                <Translation id="TR_UNSUPPORTED_COINS" />
                            </Tooltip>
                        }
                    >
                        <CoinGroup
                            networks={unsupportedMainnets}
                            enabledNetworks={enabledNetworks}
                        />
                    </CollapsibleBox>
                )}
                {(isDesktop() || (isWeb() && isTorEnabled)) && (
                    <CollapsibleBox
                        heading={
                            <Row gap={12}>
                                <Translation id="TR_TOR" />
                                <Badge intent="neutral" size="small">
                                    <Translation id="TR_ONBOARDING_ADVANCED" />
                                </Badge>
                            </Row>
                        }
                    >
                        <TorSection torStatus={torStatus} />
                    </CollapsibleBox>
                )}
            </Column>
        </OnboardingCard>
    );
};
