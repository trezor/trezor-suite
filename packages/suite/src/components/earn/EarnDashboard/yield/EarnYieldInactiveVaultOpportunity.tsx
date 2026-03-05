import { Translation } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Table } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { type YieldInactiveVaultOpportunity } from './types';
import { EarnAccountCell } from '../common/EarnAccountCell';

type EarnYieldInactiveVaultOpportunityProps = {
    opportunity: YieldInactiveVaultOpportunity;
};

export const EarnYieldInactiveVaultOpportunity = ({
    opportunity,
}: EarnYieldInactiveVaultOpportunityProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { name } = getNetwork(opportunity.networkSymbol);

    const openAddAccountModal = () => {
        if (!device) {
            return;
        }

        dispatch(
            openModal({
                type: 'add-account',
                device,
                symbol: opportunity.networkSymbol,
                noRedirect: true,
                isCoinjoinDisabled: true,
                isBackClickDisabled: true,
            }),
        );
    };

    return (
        <Table.Row>
            <Table.Cell>
                <EarnAccountCell
                    symbol={opportunity.networkSymbol}
                    iconToken={opportunity.vault.token}
                    showAssetNetworkIcon
                    subtitle={opportunity.vault.metadata.name}
                />
            </Table.Cell>

            <Table.Cell>
                <ApyValue apy={opportunity.apyPercentage} />
            </Table.Cell>

            <Table.Cell colSpan={2} />

            <Table.Cell align="end">
                <Button size="small" onClick={openAddAccountModal} isDisabled={isDiscoveryRunning}>
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_ACTIVATE"
                        values={{ networkName: name }}
                    />
                </Button>
            </Table.Cell>
        </Table.Row>
    );
};
