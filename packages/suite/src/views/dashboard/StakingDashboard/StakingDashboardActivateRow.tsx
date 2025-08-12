import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery, selectPoolStatsApyData } from '@suite-common/wallet-core';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';
import { Button, Paragraph, Table } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';

import { StakingDashboardAccountCell } from './StakingDashboardAccountCell';

export const StakingDashboardActivateRow = ({ symbol }: { symbol: NetworkSymbol }) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const apy = useSelector(state => selectPoolStatsApyData(state, symbol));
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { displaySymbol, name } = getNetwork(symbol);
    const { MIN_AMOUNT_FOR_STAKING } = getStakingLimitsByNetworkSymbol(symbol);

    const startNetworkDiscovery = () => {
        if (!device) return;

        dispatch(
            openModal({
                type: 'add-account',
                device,
                symbol,
                noRedirect: true,
                isCoinjoinDisabled: true,
                isBackClickDisabled: true,
            }),
        );
    };

    return (
        <Table.Row>
            <Table.Cell>
                <StakingDashboardAccountCell symbol={symbol} />
            </Table.Cell>

            <Table.Cell>~{apy}%</Table.Cell>

            <Table.Cell colSpan={2}>
                <Paragraph typographyStyle="body" variant="tertiary">
                    <Translation
                        id="TR_STAKING_DASHBOARD_MINIMUM_STAKE"
                        values={{
                            amount: MIN_AMOUNT_FOR_STAKING.toString(),
                            displaySymbol,
                        }}
                    />
                </Paragraph>
            </Table.Cell>

            <Table.Cell align="end">
                <Button
                    size="small"
                    onClick={startNetworkDiscovery}
                    isDisabled={isDiscoveryRunning}
                >
                    <Translation
                        id="TR_STAKING_DASHBOARD_ACTIVATE"
                        values={{ networkName: name }}
                    />
                </Button>
            </Table.Cell>
        </Table.Row>
    );
};
