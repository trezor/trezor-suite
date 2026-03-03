import { ReactNode } from 'react';

import { H3, IconCircle, IconName, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface StakingFeatureProps {
    icon: IconName;
    title: ReactNode;
    description: ReactNode;
}

export const StakingFeature = ({ icon, title, description }: StakingFeatureProps) => (
    <section>
        <IconCircle name={icon} intent="brand" size={96} />
        <H3 margin={{ top: spacings.md }}>{title}</H3>
        <Paragraph intent="neutral" priority="secondary">
            {description}
        </Paragraph>
    </section>
);
