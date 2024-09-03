import { ReactNode } from 'react';
import { H3, Paragraph } from '@trezor/components';
import { IconBorderedWrapper } from 'src/components/suite';
import { spacings } from '@trezor/theme';

interface StakingFeatureProps {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
}

export const StakingFeature = ({ icon, title, description }: StakingFeatureProps) => (
    <section>
        <IconBorderedWrapper>{icon}</IconBorderedWrapper>
        <H3 margin={{ top: spacings.md }}>{title}</H3>
        <Paragraph variant="tertiary">{description}</Paragraph>
    </section>
);
