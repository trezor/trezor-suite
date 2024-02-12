import { ReactNode } from 'react';
import styled from 'styled-components';
import { H3, Paragraph, variables } from '@trezor/components';
import { IconBorderedWrapper } from 'src/components/suite';
import { spacingsPx } from '@trezor/theme';

const StyledH3 = styled(H3)<{ size?: string }>`
    margin-top: ${spacingsPx.lg};
    font-size: ${({ size }) => size === 'small' && variables.FONT_SIZE.NORMAL};
`;

const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledP = styled(GreyP)`
    margin-top: ${spacingsPx.xs};
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface StakingFeatureProps {
    icon: ReactNode;
    title: ReactNode;
    titleSize?: 'small' | 'normal';
    description: ReactNode;
    extraDescription?: ReactNode;
}

export const StakingFeature = ({
    icon,
    title,
    titleSize = 'normal',
    description,
    extraDescription,
}: StakingFeatureProps) => (
    <div>
        <IconBorderedWrapper>{icon}</IconBorderedWrapper>

        <StyledH3 size={titleSize}>{title}</StyledH3>

        <GreyP>{description}</GreyP>

        <StyledP>{extraDescription}</StyledP>
    </div>
);
