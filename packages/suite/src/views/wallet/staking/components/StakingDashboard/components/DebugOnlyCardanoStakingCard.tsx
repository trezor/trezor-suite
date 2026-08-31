import styled from 'styled-components';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { useSelector } from '@suite-common/redux-utils';
import { EVERSTAKE_POOL_NAMES } from '@suite-common/wallet-constants';
import { selectCardanoPoolsInfo } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getCardanoAccountPoolId,
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
} from '@suite-common/wallet-utils';
import { Card, Column, Icon, InfoItem, Paragraph, Row } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
const ParagraphWrapper = styled.div`
    white-space: pre-wrap;
    overflow-wrap: anywhere;
`;

interface DebugOnlyCardanoStakingCardProps {
    account: Account;
}

export const DebugOnlyCardanoStakingCard = ({ account }: DebugOnlyCardanoStakingCardProps) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isStakedWithEverstake = isCardanoStakedWithEverstake(account, cardanoStakingPools);
    const isStakedWithFiveBinaries = isCardanoStakedWithFiveBinaries(account);
    const poolId = getCardanoAccountPoolId(account);
    const poolName = poolId ? EVERSTAKE_POOL_NAMES[poolId] : undefined;

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
                                {isStakedWithEverstake ? 'Everstake' : ''}
                                {isStakedWithFiveBinaries ? 'FiveBinaries' : ''}
                                {!isStakedWithEverstake && !isStakedWithFiveBinaries
                                    ? 'Unknown'
                                    : ''}
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
                            <Paragraph typographyStyle="body-xs">
                                {account?.misc?.staking.poolId}
                            </Paragraph>
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
                                {account?.misc?.staking.address}
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
                            <Paragraph typographyStyle="body-xs">
                                {account?.misc?.staking.drep?.drep_id}
                            </Paragraph>
                        </ParagraphWrapper>
                    </InfoItem>
                </Column>
            </Column>
        </Card>
    );
};
