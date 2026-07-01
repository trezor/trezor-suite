import { Column, H4, IconCircle, Paragraph, Row } from '@trezor/components';

import { type EmptyStakingCardContentFeature } from './useEmptyStakingCardContent';

interface EmptyStakingCardFeatureProps {
    feature: EmptyStakingCardContentFeature;
}

export const EmptyStakingCardFeature = ({ feature }: EmptyStakingCardFeatureProps) => (
    <Row gap={16} alignItems="flex-start">
        <Column>
            <IconCircle name={feature.icon} intent="brand" size={40} />
        </Column>
        <Column gap={4}>
            <H4>{feature.title}</H4>
            <Paragraph intent="neutral" priority="secondary">
                {feature.text}
            </Paragraph>
        </Column>
    </Row>
);
