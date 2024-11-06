import { ButtonHTMLAttributes } from 'react';

import styled from 'styled-components';

import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

import { useElevation } from '../../ElevationContext/ElevationContext';

const Button = styled.button<{ $elevation: Elevation }>`
    max-width: 100px;
    height: 60px;
    transition: all 0.2s;
    position: relative;
    cursor: pointer;
    margin: ${spacingsPx.xxs};

    width: 100%;

    border-radius: ${borders.radii.xxs};
    border: 1px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};

    &:first-child {
        margin-left: ${spacingsPx.zero};
    }

    &:last-child {
        margin-right: ${spacingsPx.zero};
    }

    &:hover {
        background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
    }

    &::before {
        width: 6px;
        height: 6px;
        content: ' ';
        position: absolute;
        border-radius: 100%;
        background: ${({ theme }) => theme.textDefault};
        top: calc(50% - 3px);
        left: calc(50% - 3px);
    }

    &:hover::before {
        background: ${({ theme }) => theme.textSecondaryHighlight};
    }
`;

export interface PinButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    'data-value': string;
}

export const PinButton = (props: PinButtonProps) => {
    const { elevation } = useElevation();

    return <Button type="button" $elevation={elevation} {...props} />;
};
