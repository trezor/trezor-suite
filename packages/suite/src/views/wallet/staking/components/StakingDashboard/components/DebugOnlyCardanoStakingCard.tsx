import styled from 'styled-components';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import {
    selectStakingAccountPositionDetails,
    selectStakingAccountPositionEntry,
} from '@suite-common/earn-staking';
import { EVERSTAKE_POOL_NAMES } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Card, Column, Icon, InfoItem, Paragraph, Row } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { useSelector } from '#src/hooks/suite/useSelector';

const ParagraphWrapper = styled.div`
    white-space: pre-wrap;
    overflow-wrap: anywhere;
`;

interface DebugOnlyCardanoStakingCardProps {
    account: Account;
}

export const DebugOnlyCardanoStakingCard = ({ account }: DebugOnlyCardanoStakingCardProps) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const positionEntry = useSelector(state =>
        selectStakingAccountPositionEntry(state, account.key),
    );
    const delegation = useSelector(state =>
        selectStakingAccountPositionDetails(state, account.key, 'cardano-delegation'),
    );

    const poolId = delegation?.poolId ?? null;
    const poolName = poolId === null ? undefined : EVERSTAKE_POOL_NAMES[poolId];

    if (!isDebugModeActive || account.networkType !== 'cardano') return null;

    return (
        <Card paddingType="small" flex="1">
            <Column alignItems="flex-start" flex="1" gap={20}>
                <Row columnGap={4}>
                    <Icon as={InfoIcon} intent="neutral" priority="secondary" />

                    <DebugOnlyBadge />
                </Row>

                <Column rowGap={8}>
                    <InfoItem
                        label="Provider"
                        direction="row"
                        labelWidth={90}
                        verticalAlignment="start"
                    >
                        <ParagraphWrapper>
                            <Paragraph typographyStyle="body-xs">
                                {positionEntry?.descriptor.providerId ?? 'Unknown'}
                            </Paragraph>
                        </ParagraphWrapper>
                    </InfoItem>

                    <InfoItem
                        label="Pool ID"
                        direction="row"
                        labelWidth={90}
                        verticalAlignment="start"
                    >
                        <ParagraphWrapper>
                            <Paragraph typographyStyle="body-xs">{poolId}</Paragraph>
                        </ParagraphWrapper>
                    </InfoItem>

                    {poolName && (
                        <InfoItem
                            label="Pool name"
                            direction="row"
                            labelWidth={90}
                            verticalAlignment="start"
                        >
                            <ParagraphWrapper>
                                <Paragraph typographyStyle="body-xs">{poolName}</Paragraph>
                            </ParagraphWrapper>
                        </InfoItem>
                    )}

                    <InfoItem
                        label="Stake address"
                        direction="row"
                        labelWidth={90}
                        verticalAlignment="start"
                    >
                        <ParagraphWrapper>
                            <Paragraph typographyStyle="body-xs">
                                {account.misc?.staking.address}
                            </Paragraph>
                        </ParagraphWrapper>
                    </InfoItem>

                    <InfoItem
                        label="DRep"
                        direction="row"
                        labelWidth={90}
                        verticalAlignment="start"
                    >
                        <ParagraphWrapper>
                            <Paragraph typographyStyle="body-xs">{delegation?.drep?.id}</Paragraph>
                        </ParagraphWrapper>
                    </InfoItem>
                </Column>
            </Column>
        </Card>
    );
};
