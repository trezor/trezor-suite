import { selectSelectedDevice } from '@suite-common/wallet-core';
import { getFailedAccounts, sortByCoin } from '@suite-common/wallet-utils';
import {
    Box,
    Column,
    Divider,
    Row,
    SkeletonRectangle,
    TextButton,
    Tooltip,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountSearchBox } from './AccountSearchBox';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { useAvailableNetworkSymbols } from './useAvailableNetworkSymbols';
import { setIsCoinsFilterVisible } from '../../../../actions/suite/suiteActions';
import { useAccountSearch, useDiscovery, useDispatch, useSelector } from '../../../../hooks/suite';
import { Translation } from '../../../suite';
import { CollapsedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';

export const AccountsMenuHeader = () => {
    const { coinFilter } = useAccountSearch();
    
    const device = useSelector(selectSelectedDevice);
    const accounts = useSelector(state => state.wallet.accounts);
    const { discovery } = useDiscovery();

    const staticSessionId = device?.state?.staticSessionId;
    const failed = getFailedAccounts(staticSessionId, discovery);
    const list = sortByCoin(accounts.filter(a => a.deviceState === staticSessionId).concat(failed));
    const isEmpty = list.length === 0;

    const isDiscoveryRunning = discovery?.status === 'progress';
    const isCoinsFilterVisible = useSelector(state => state.suite.settings.isCoinsFilterVisible);
    const dispatch = useDispatch();
    const availableNetworksSymbols = useAvailableNetworkSymbols();

    const toggleCoinsFilter = () =>
        dispatch(
            setIsCoinsFilterVisible({
                isCoinsFilterVisible: !isCoinsFilterVisible,
            }),
        );
    const showCoinFilter = availableNetworksSymbols.length > 1;

    return (
        <>
            <Divider margin={{ top: 0, bottom: spacings.sm }} />
            <Box margin={{ horizontal: spacings.xs }}>
                <ExpandedSidebarOnly>
                    <Row justifyContent="space-between" gap={spacings.xs}>
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
                                        <TextButton
                                            size="small"
                                            variant={isCoinsFilterVisible ? 'primary' : 'tertiary'}
                                            icon={coinFilter ? 'funnelSimpleActive' : 'funnelSimple'}
                                            onClick={toggleCoinsFilter}
                                            data-testid="@account-menu/filter-accounts"
                                        />
                                    </Tooltip>
                                )}

                                <AddAccountButton
                                    isFullWidth={isEmpty}
                                    data-testid="@account-menu/add-account"
                                    device={device}
                                />
                            </>
                        )}
                    </Row>
                    {isCoinsFilterVisible && showCoinFilter && <CoinsFilter />}
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center" margin={{ bottom: spacings.sm }}>
                        <AddAccountButton
                            isFullWidth={false}
                            data-testid="@account-menu/add-account"
                            device={device}
                        />
                    </Column>
                </CollapsedSidebarOnly>
            </Box>
        </>
    );
};
