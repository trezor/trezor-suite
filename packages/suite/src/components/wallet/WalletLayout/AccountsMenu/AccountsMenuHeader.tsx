import { useState } from 'react';
import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectIsCoinsFilterVisible, suiteSettingsActions } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { selectAllAccountsToList, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Box, Column, Divider, Icon, Row, Skeleton, Tooltip } from '@trezor/components';
import { FunnelSimpleIcon } from '@trezor/icons';

import { CollapsedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { useAccountSearch, useSelector } from 'src/hooks/suite';

import { AccountSearchBox } from './AccountSearchBox';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { useAvailableNetworkSymbols } from './useAvailableNetworkSymbols';

const Indicator = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.contentBrand};
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: none;
`;

const RelativeWrapper = styled.div`
    position: relative;
`;

export const AccountsMenuHeader = () => {
    const { coinFilter } = useAccountSearch();

    const device = useSelector(selectSelectedDevice);
    const accounts = useSelector(selectAllAccountsToList);
    const [isHovered, setIsHovered] = useState(false);

    const isEmpty = accounts.length === 0;

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isCoinsFilterVisible = useSelector(selectIsCoinsFilterVisible);
    const dispatch = useDispatch();
    const availableNetworksSymbols = useAvailableNetworkSymbols();

    const toggleCoinsFilter = () =>
        dispatch(suiteSettingsActions.setIsCoinsFilterVisible(!isCoinsFilterVisible));
    const showCoinFilter = availableNetworksSymbols.length > 1;

    return (
        <>
            <Divider margin={{ top: 0, bottom: 12 }} />
            <Box margin={{ horizontal: 8 }}>
                <ExpandedSidebarOnly>
                    <Row gap={12} padding={{ right: !isEmpty ? 10 : 0 }}>
                        {isDiscoveryRunning ? (
                            <Skeleton animate width="100%" height={20} margin={{ left: 4 }} />
                        ) : (
                            <>
                                {!isEmpty && <AccountSearchBox />}
                                {!isEmpty && showCoinFilter && (
                                    <Tooltip
                                        content={
                                            <Translation
                                                id={
                                                    isCoinsFilterVisible
                                                        ? 'TR_HIDE_COINS_FILTER'
                                                        : 'TR_SHOW_COINS_FILTER'
                                                }
                                            />
                                        }
                                    >
                                        <RelativeWrapper
                                            onMouseEnter={() => setIsHovered(true)}
                                            onMouseLeave={() => setIsHovered(false)}
                                        >
                                            {coinFilter.length > 0 && <Indicator />}
                                            <Icon
                                                size={16}
                                                intent={
                                                    isCoinsFilterVisible && !isHovered
                                                        ? 'brand'
                                                        : 'neutral'
                                                }
                                                priority={
                                                    isCoinsFilterVisible || isHovered
                                                        ? 'primary'
                                                        : 'secondary'
                                                }
                                                as={FunnelSimpleIcon}
                                                onClick={toggleCoinsFilter}
                                                data-testid="@account-menu/filter-accounts"
                                            />
                                        </RelativeWrapper>
                                    </Tooltip>
                                )}

                                {!isEmpty && <AddAccountButton device={device} />}
                            </>
                        )}
                    </Row>
                    {isCoinsFilterVisible && showCoinFilter && !isEmpty && <CoinsFilter />}
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center" margin={{ bottom: 12 }}>
                        {!isEmpty && <AddAccountButton device={device} />}
                    </Column>
                </CollapsedSidebarOnly>
            </Box>
        </>
    );
};
