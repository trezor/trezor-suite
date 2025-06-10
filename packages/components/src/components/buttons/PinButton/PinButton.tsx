import { ButtonHTMLAttributes } from 'react';

import styled from 'styled-components';

import { Elevation, borders, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

import { useElevation } from '../../ElevationContext/ElevationContext';

const Button = styled.button<{ $elevation: Elevation }>`
    height: 50px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 100%;
    border-radius: ${borders.radii.sm};
    border: 1px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};

    &:hover {
        background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
    }

    &::before {
        width: 6px;
        height: 6px;
        content: ' ';
        border-radius: 100%;
        background: ${({ theme }) => theme.textDefault};
    }

    &:hover::before {
        background: ${({ theme }) => theme.textSecondaryHighlight};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

export interface PinButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    'data-value': string;
    disabled?: boolean;
}

export const PinButton = (props: PinButtonProps) => {
    const { elevation } = useElevation();

    return <Button type="button" $elevation={elevation} {...props} />;
};
