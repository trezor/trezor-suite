import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, Column, Icon, Paragraph } from '@trezor/components';
import { PercentIcon } from '@trezor/icons';

import { StakingRateTooltip } from '#src/components/earn/staking/StakingRateTooltip';

import { ApyValue } from '../../ApyValue';

interface ApyCardProps {
    networkSymbol: NetworkSymbol;
    apy?: number | null;
    isNotEarning?: boolean;
}

export const ApyCard = ({ networkSymbol, apy, isNotEarning }: ApyCardProps) => (
    <Card paddingType="small" flex="1">
        <Column alignItems="flex-start" flex="1" gap={20}>
            <Icon as={PercentIcon} intent="neutral" priority="secondary" />

            <Column margin={{ top: 'auto' }}>
                <Paragraph typographyStyle="headline-md">
                    <StakingRateTooltip
                        networkSymbol={networkSymbol}
                        rate={isNotEarning ? null : apy}
                        rateKind="apy"
                    >
                        <ApyValue apy={apy} isNotEarning={isNotEarning} />
                    </StakingRateTooltip>
                </Paragraph>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_STAKE_APY" />
                </Paragraph>
            </Column>
        </Column>
    </Card>
);
