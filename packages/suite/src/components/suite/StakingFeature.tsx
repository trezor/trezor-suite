import { type ReactNode } from 'react';

import { H3, IconCircle, type IconComponent, Paragraph } from '@trezor/components';

interface StakingFeatureProps {
    icon: IconComponent;
    title: ReactNode;
    description: ReactNode;
}

export const StakingFeature = ({ icon, title, description }: StakingFeatureProps) => (
    <section>
        <IconCircle icon={icon} intent="brand" size={96} />
        <H3 margin={{ top: 16 }}>{title}</H3>
        <Paragraph intent="neutral" priority="secondary">
            {description}
        </Paragraph>
    </section>
);
