import { EventHandler, SyntheticEvent, KeyboardEvent, ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { borders, Color, spacingsPx, typography } from '@trezor/theme';

import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { Icon } from '../../assets/Icon/Icon';
import { getFocusShadowStyle } from '../../../utils/utils';

interface VariantStyles {
    background: Color;
    border: Color;
    backgroundHover: Color;
    borderHover: Color;
    backgroundChecked: Color;
    borderChecked: Color;
    backgroundDisabled: Color;
    borderDisabled: Color;
    backgroundDisabledChecked: Color;
    borderDisabledChecked: Color;
}

export const variantStyles: Record<CheckboxVariant, VariantStyles> = {
    primary: {
        background: 'backgroundSurfaceElevation1',
        border: 'borderOnElevation1',
        backgroundHover: 'backgroundSurfaceElevation0',
        borderHover: 'borderFocus',
        backgroundChecked: 'backgroundPrimaryDefault',
        borderChecked: 'backgroundPrimaryDefault',
        backgroundDisabled: 'backgroundSurfaceElevationNegative',
        borderDisabled: 'borderOnElevation0',
        backgroundDisabledChecked: 'backgroundPrimarySubtleOnElevation0',
        borderDisabledChecked: 'backgroundPrimarySubtleOnElevation0',
    },
    'alert-red': {
        background: 'backgroundAlertRedSubtleOnElevation0',
        border: 'borderAlertRed',
        backgroundHover: 'backgroundSurfaceElevation0',
        borderHover: 'borderAlertRed',
        backgroundChecked: 'borderAlertRed',
        borderChecked: 'borderAlertRed',
        backgroundDisabled: 'backgroundSurfaceElevationNegative',
        borderDisabled: 'backgroundAlertRedSubtleOnElevation0',
        backgroundDisabledChecked: 'backgroundAlertRedSubtleOnElevation1',
        borderDisabledChecked: 'backgroundAlertRedSubtleOnElevation1',
    },
    'alert-yellow': {
        background: 'backgroundAlertYellowSubtleOnElevation0',
        border: 'backgroundAlertYellowBold',
        backgroundHover: 'backgroundSurfaceElevation0',
        borderHover: 'backgroundAlertYellowBold',
        backgroundChecked: 'backgroundAlertYellowBold',
        borderChecked: 'backgroundAlertYellowBold',
        backgroundDisabled: 'backgroundSurfaceElevationNegative',
        borderDisabled: 'backgroundAlertYellowSubtleOnElevation0',
        backgroundDisabledChecked: 'backgroundAlertYellowSubtleOnElevation1',
        borderDisabledChecked: 'backgroundAlertYellowSubtleOnElevation1',
    },
};

export const Container = styled.div<Pick<CheckboxProps, 'isDisabled' | 'labelAlignment'>>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    flex-direction: ${({ labelAlignment }) => labelAlignment === 'left' && 'row-reverse'};
    pointer-events: ${({ isDisabled }) => isDisabled && 'none'};
    cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
`;

export const CheckContainer = styled.div<{ variant: CheckboxVariant }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${spacingsPx.xl};
    height: ${spacingsPx.xl};
    min-width: ${spacingsPx.xl};
    min-height: ${spacingsPx.xl};
    border-radius: ${borders.radii.xxs};
    background: ${({ theme, variant }) => theme[variantStyles[variant].background]};
    border: 2px solid ${({ theme, variant }) => theme[variantStyles[variant].border]};
    transition:
        border 0.1s,
        background 0.1s,
        box-shadow 0.1s ease-out;

    input:checked + && {
        background: ${({ theme, variant }) => theme[variantStyles[variant].backgroundChecked]};
        border-color: ${({ theme, variant }) => theme[variantStyles[variant].borderChecked]};
    }

    input:disabled:not(:checked) + && {
        background: ${({ theme, variant }) => theme[variantStyles[variant].backgroundDisabled]};
        border-color: ${({ theme, variant }) => theme[variantStyles[variant].borderDisabled]};
    }

    input:disabled:checked + && {
        background: ${({ theme, variant }) =>
            theme[variantStyles[variant].backgroundDisabledChecked]};
        border-color: ${({ theme, variant }) =>
            theme[variantStyles[variant].backgroundDisabledChecked]};
    }

    ${/* sc-selector */ Container}:hover input:not(:disabled):not(:checked) + && {
        background: ${({ theme, variant }) => theme[variantStyles[variant].backgroundHover]};
        border-color: ${({ theme, variant }) => theme[variantStyles[variant].borderHover]};
    }

    ${getFocusShadowStyle()}
`;

const CheckIcon = styled(Icon)<{ isVisible: boolean }>`
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
    transition: opacity 0.1s;
`;

export const Label = styled.div<{ isRed: boolean }>`
    display: flex;
    justify-content: center;
    text-align: left;
    user-select: none;
    color: ${({ theme, isRed }) => isRed && theme.textAlertRed};
    ${typography.body}
    transition: color 0.1s;

    input:disabled ~ & {
        color: ${({ theme }) => theme.textDisabled};
    }
`;

export const HiddenInput = styled.input`
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
`;

export type CheckboxVariant = 'primary' | 'alert-red' | 'alert-yellow';
export type LabelAlignment = 'left' | 'right';

export interface CheckboxProps {
    variant?: CheckboxVariant;
    isChecked?: boolean;
    isDisabled?: boolean;
    labelAlignment?: LabelAlignment;
    onClick: EventHandler<SyntheticEvent>;
    'data-test'?: string;
    className?: string;
    children?: ReactNode;
}

export const Checkbox = ({
    variant = 'primary',
    isChecked,
    isDisabled,
    labelAlignment = 'right',
    onClick,
    'data-test': dataTest,
    className,
    children,
}: CheckboxProps) => {
    const theme = useTheme();

    const handleKeyUp = (event: KeyboardEvent<HTMLElement>) => {
        if (event.code === KEYBOARD_CODE.SPACE || event.code === KEYBOARD_CODE.ENTER) {
            onClick(event);
        }
    };

    return (
        <Container
            isDisabled={isDisabled}
            labelAlignment={labelAlignment}
            onClick={onClick}
            onKeyUp={handleKeyUp}
            data-test={dataTest}
            className={className}
        >
            <HiddenInput
                checked={isChecked}
                disabled={isDisabled}
                readOnly
                type="checkbox"
                tabIndex={-1}
            />

            <CheckContainer tabIndex={0} variant={variant}>
                <CheckIcon
                    isVisible={!!isChecked}
                    size={24}
                    color={theme.iconOnPrimary}
                    icon="CHECK"
                />
            </CheckContainer>

            {children && <Label isRed={variant === 'alert-red'}>{children}</Label>}
        </Container>
    );
};
