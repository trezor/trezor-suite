import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { typography } from '@trezor/theme';

interface BannerPointsProps {
    points: ReactNode[];
}

const ListItem = styled.li`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    list-style-type: disc;
    list-style-position: inside;

    &:only-child {
        list-style-type: none;
        list-style-position: unset;
    }
`;

export const BannerPoints = ({ points }: BannerPointsProps) => {
    if (points.length === 0) return null;

    return (
        <ul>
            {points.map((point, i) => (
                <ListItem key={`bullet-${i}-${point}`}>{point}</ListItem>
            ))}
        </ul>
    );
};
