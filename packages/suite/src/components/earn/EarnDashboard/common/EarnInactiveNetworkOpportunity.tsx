import { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Paragraph, Table } from '@trezor/components';

import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
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
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { name } = getNetwork(symbol);

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
                <Button size="small" onClick={openAddAcountModal} isDisabled={isDiscoveryRunning}>
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_ACTIVATE"
                        values={{ networkName: name }}
                    />
                </Button>
            </Table.Cell>
        </Table.Row>
    );
};
