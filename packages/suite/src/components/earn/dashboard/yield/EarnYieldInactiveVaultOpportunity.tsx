import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { getNetwork } from '@suite-common/wallet-config';
import { selectEnabledNetworks, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, TOOLTIP_DELAY_NORMAL, Table, Tooltip } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { EarnYieldApyTooltip } from './EarnYieldApyTooltip';
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
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isDiscoveringThisNetwork =
        isDiscoveryRunning && enabledNetworks.includes(opportunity.networkSymbol);
    const { name } = getNetwork(opportunity.networkSymbol);

    const isDeviceDisconnected = !device || !device.connected;
    const isButtonDisabled = isDeviceDisconnected || isDiscoveryRunning;
    const tooltipMessage = isDeviceDisconnected ? (
        <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />
    ) : undefined;

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
                    subtitle={opportunity.vault.outputToken?.name ?? ''}
                />
            </Table.Cell>

            <Table.Cell>
                <EarnYieldApyTooltip
                    vault={opportunity.vault}
                    apyPercentage={opportunity.apyPercentage}
                    networkSymbol={opportunity.networkSymbol}
                />
            </Table.Cell>

            <Table.Cell colSpan={2} />

            <Table.Cell align="end">
                <Tooltip
                    isActive={!!tooltipMessage}
                    tooltipMaxWidth={200}
                    content={tooltipMessage}
                    placement="top"
                    cursor="not-allowed"
                    delayShow={TOOLTIP_DELAY_NORMAL}
                >
                    <Button
                        size="small"
                        onClick={openAddAccountModal}
                        isDisabled={isButtonDisabled}
                        isLoading={isDiscoveringThisNetwork}
                    >
                        <Translation
                            id="TR_EARN_STAKING_DASHBOARD_ACTIVATE"
                            values={{ networkName: name }}
                        />
                    </Button>
                </Tooltip>
            </Table.Cell>
        </Table.Row>
    );
};
