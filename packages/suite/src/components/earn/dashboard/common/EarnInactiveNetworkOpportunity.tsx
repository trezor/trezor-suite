import { type ReactNode } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectEnabledNetworks, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Paragraph, TOOLTIP_DELAY_NORMAL, Table, Tooltip } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { EarnAccountCell } from './EarnAccountCell';

type EarnInactiveNetworkOpportunityProps = {
    symbol: NetworkSymbol;
    apy: number | null;
    note?: ReactNode;
};

export const EarnInactiveNetworkOpportunity = ({
    symbol,
    apy,
    note,
}: EarnInactiveNetworkOpportunityProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isDiscoveringThisNetwork = isDiscoveryRunning && enabledNetworks.includes(symbol);
    const { name } = getNetwork(symbol);

    const isDeviceDisconnected = !device || !device.connected;
    const isButtonDisabled = isDeviceDisconnected || isDiscoveryRunning;
    const tooltipMessage = isDeviceDisconnected ? (
        <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />
    ) : undefined;

    const openAddAcountModal = () => {
        if (!device) {
            return;
        }

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
                <EarnAccountCell symbol={symbol} />
            </Table.Cell>

            <Table.Cell>
                <ApyValue apy={apy} />
            </Table.Cell>

            <Table.Cell colSpan={2}>
                {note && (
                    <Paragraph typographyStyle="body-md" intent="neutral">
                        {note}
                    </Paragraph>
                )}
            </Table.Cell>

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
                        onClick={openAddAcountModal}
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
