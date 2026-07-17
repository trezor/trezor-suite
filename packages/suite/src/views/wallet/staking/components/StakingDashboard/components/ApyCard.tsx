import { Translation } from '@suite/intl';
import { Card, Column, Icon, Paragraph } from '@trezor/components';
import { PercentIcon } from '@trezor/icons';

import { ApyValue } from '../../ApyValue';
interface ApyCardProps {
    apy?: number | null;
}

export const ApyCard = ({ apy }: ApyCardProps) => (
    <Card paddingType="small" flex="1">
        <Column alignItems="flex-start" flex="1" gap={20}>
            <Icon as={PercentIcon} intent="neutral" priority="secondary" />

            <Column margin={{ top: 'auto' }}>
                <Paragraph typographyStyle="headline-md">
                    <ApyValue apy={apy} />
                </Paragraph>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_STAKE_APY" />
                </Paragraph>
            </Column>
        </Column>
    </Card>
);
