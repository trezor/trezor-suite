import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectIsCoinsFilterVisible, suiteSettingsActions } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { Box, Column, Divider, Icon, Row, SkeletonRectangle, Tooltip } from '@trezor/components';

import { CollapsedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from 'src/components/suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { useAccountSearch, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';

import { AccountSearchBox } from './AccountSearchBox';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { useAvailableNetworkSymbols } from './useAvailableNetworkSymbols';

const Indicator = styled.div`
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 3px solid ${({ theme }) => theme.borderElevation2};
    background-color: ${({ theme }) => theme.iconPrimaryDefault};
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
    const { discovery } = useDiscovery();

    const isEmpty = accounts.length === 0;

    const isDiscoveryRunning = discovery?.status === 'progress';
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
                            <SkeletonRectangle animate width="100%" height={38} />
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
                                        <RelativeWrapper>
                                            {coinFilter.length > 0 && <Indicator />}
                                            <Icon
                                                size={16}
                                                intent={isCoinsFilterVisible ? 'brand' : 'neutral'}
                                                priority={
                                                    isCoinsFilterVisible ? 'primary' : 'secondary'
                                                }
                                                name="funnelSimple"
                                                onClick={toggleCoinsFilter}
                                                data-testid="@account-menu/filter-accounts"
                                            />
                                        </RelativeWrapper>
                                    </Tooltip>
                                )}

                                <AddAccountButton isIconOnly={!isEmpty} device={device} />
                            </>
                        )}
                    </Row>
                    {isCoinsFilterVisible && showCoinFilter && <CoinsFilter />}
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center" margin={{ bottom: 12 }}>
                        <AddAccountButton isIconOnly={true} device={device} />
                    </Column>
                </CollapsedSidebarOnly>
            </Box>
        </>
    );
};
