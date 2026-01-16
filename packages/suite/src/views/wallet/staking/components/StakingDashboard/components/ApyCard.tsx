import { Translation } from '@suite/intl';
import { Card, Column, Icon, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface ApyCardProps {
    apy?: number;
}

export const ApyCard = ({ apy }: ApyCardProps) => (
    <Card paddingType="small" flex="1">
        <Column alignItems="flex-start" flex="1" gap={spacings.lg}>
            <Icon name="percent" variant="tertiary" />

            <Column margin={{ top: 'auto' }}>
                <Paragraph typographyStyle="titleMedium">
                    {apy ? `${apy}%` : <Translation id="TR_STAKE_UNKNOWN_APY" />}
                </Paragraph>
                <Paragraph typographyStyle="hint" variant="tertiary">
                    <Translation id="TR_STAKE_APY" />
                </Paragraph>
            </Column>
        </Column>
    </Card>
);
