import { ReactNode } from 'react';
import { H3, Paragraph, IconCircle, IconName } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface StakingFeatureProps {
    icon: IconName;
    title: ReactNode;
    description: ReactNode;
}

export const StakingFeature = ({ icon, title, description }: StakingFeatureProps) => (
    <section>
        <IconCircle name={icon} variant="primary" size="extraLarge" />
        <H3 margin={{ top: spacings.md }}>{title}</H3>
        <Paragraph variant="tertiary">{description}</Paragraph>
    </section>
);
