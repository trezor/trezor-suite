import styled from 'styled-components';

import { selectIsDebugModeActive } from '@suite/settings';
import { selectCardanoPoolsInfo } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
} from '@suite-common/wallet-utils';
import { Card, Column, Icon, InfoItem, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useSelector } from 'src/hooks/suite';

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

    if (!isDebugModeActive || account.networkType !== 'cardano') return null;

    return (
        <Card paddingType="small" flex="1">
            <Column alignItems="flex-start" flex="1" gap={spacings.lg}>
                <Row columnGap={spacings.xxs}>
                    <Icon name="info" intent="neutral" priority="secondary" />

                    <DebugOnlyBadge />
                </Row>

                <Column rowGap={spacings.xs}>
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
