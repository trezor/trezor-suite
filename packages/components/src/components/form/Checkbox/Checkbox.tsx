import { EventHandler, SyntheticEvent, KeyboardEvent, ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { borders, Color, spacingsPx, typography } from '@trezor/theme';

import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { getFocusShadowStyle } from '../../../utils/utils';
import { UIHorizontalAlignment, UIVerticalAlignment, UIVariant } from '../../../config/types';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { Icon } from '../../Icon/Icon';

export const allowedCheckboxFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedCheckboxFrameProps = Pick<
    FrameProps,
    (typeof allowedCheckboxFrameProps)[number]
>;

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
        border: 'iconSubdued',
        backgroundHover: 'backgroundSurfaceElevation0',
        borderHover: 'borderFocus',
        backgroundChecked: 'backgroundPrimaryDefault',
        borderChecked: 'backgroundPrimaryDefault',
        backgroundDisabled: 'backgroundSurfaceElevationNegative',
        borderDisabled: 'borderElevation1',
        backgroundDisabledChecked: 'backgroundPrimarySubtleOnElevation0',
        borderDisabledChecked: 'backgroundPrimarySubtleOnElevation0',
    },
    destructive: {
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
    warning: {
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

type ContainerProps = TransientProps<AllowedCheckboxFrameProps> & {
    $isDisabled?: boolean;
    $labelAlignment?: LabelAlignment;
    $verticalAlignment?: VerticalAlignment;
};

export const Container = styled.div<ContainerProps>`
    display: flex;
    align-items: ${({ $verticalAlignment }) =>
        $verticalAlignment === 'top' ? 'flex-start' : 'center'};
    gap: ${spacingsPx.sm};
    flex-direction: ${({ $labelAlignment }) => $labelAlignment === 'left' && 'row-reverse'};
    pointer-events: ${({ $isDisabled }) => $isDisabled && 'none'};
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'default' : 'pointer')};
    ${withFrameProps}
`;

export const CheckContainer = styled.div<{ $variant: CheckboxVariant }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${spacingsPx.xl};
    height: ${spacingsPx.xl};
    min-width: ${spacingsPx.xl};
    min-height: ${spacingsPx.xl};
    border-radius: ${borders.radii.xxs};
    background: ${({ theme, $variant }) => theme[variantStyles[$variant].background]};
    border: 2px solid ${({ theme, $variant }) => theme[variantStyles[$variant].border]};
    transition:
        border 0.1s,
        background 0.1s,
        box-shadow 0.1s ease-out;

    input:checked + & {
        background: ${({ theme, $variant }) => theme[variantStyles[$variant].backgroundChecked]};
        border-color: ${({ theme, $variant }) => theme[variantStyles[$variant].borderChecked]};
    }

    input:disabled + & {
        cursor: not-allowed;
        pointer-events: auto;
    }

    input:disabled:not(:checked) + & {
        background: ${({ theme, $variant }) => theme[variantStyles[$variant].backgroundDisabled]};
        border-color: ${({ theme, $variant }) => theme[variantStyles[$variant].borderDisabled]};
    }

    input:disabled:checked + & {
        background: ${({ theme, $variant }) =>
            theme[variantStyles[$variant].backgroundDisabledChecked]};
        border-color: ${({ theme, $variant }) =>
            theme[variantStyles[$variant].backgroundDisabledChecked]};
    }

    ${/* sc-selector */ Container}:hover input:not(:disabled):not(:checked) + && {
        background: ${({ theme, $variant }) => theme[variantStyles[$variant].backgroundHover]};
        border-color: ${({ theme, $variant }) => theme[variantStyles[$variant].borderHover]};
    }

    ${getFocusShadowStyle()}
`;

const CheckIcon = styled(Icon)<{ $isVisible: boolean }>`
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    transition: opacity 0.1s;
`;

export const Label = styled.div<{ $isRed: boolean }>`
    display: flex;
    justify-content: center;
    text-align: left;
    user-select: none;
    color: ${({ theme, $isRed }) => $isRed && theme.textAlertRed};
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

export const checkboxVariants = ['primary', 'destructive', 'warning'] as const;
export type CheckboxVariant = Extract<UIVariant, (typeof checkboxVariants)[number]>;

export type LabelAlignment = Extract<UIHorizontalAlignment, 'left' | 'right'>;
export type VerticalAlignment = Extract<UIVerticalAlignment, 'top' | 'center'>;

export type CheckboxProps = AllowedCheckboxFrameProps & {
    variant?: CheckboxVariant;
    isChecked?: boolean;
    isDisabled?: boolean;
    labelAlignment?: LabelAlignment;
    verticalAlignment?: VerticalAlignment;
    onClick: EventHandler<SyntheticEvent>;
    'data-testid'?: string;
    className?: string;
    children?: ReactNode;
};

export const Checkbox = ({
    variant = 'primary',
    isChecked,
    isDisabled = false,
    labelAlignment = 'right',
    verticalAlignment = 'top',
    onClick,
    'data-testid': dataTest,
    className,
    children,
    ...rest
}: CheckboxProps) => {
    const theme = useTheme();

    const handleKeyUp = (event: KeyboardEvent<HTMLElement>) => {
        if (
            !isDisabled &&
            (event.code === KEYBOARD_CODE.SPACE || event.code === KEYBOARD_CODE.ENTER)
        ) {
            onClick(event);
        }
    };

    const frameProps = pickAndPrepareFrameProps(rest, allowedCheckboxFrameProps);

    return (
        <Container
            $isDisabled={isDisabled}
            $labelAlignment={labelAlignment}
            $verticalAlignment={verticalAlignment}
            onClick={isDisabled ? undefined : onClick}
            onKeyUp={handleKeyUp}
            data-testid={dataTest}
            className={className}
            {...frameProps}
        >
            <HiddenInput
                checked={isChecked}
                disabled={isDisabled}
                readOnly
                type="checkbox"
                tabIndex={-1}
            />

            <CheckContainer tabIndex={0} $variant={variant}>
                <CheckIcon
                    $isVisible={!!isChecked}
                    size={24}
                    color={theme.iconOnPrimary}
                    name="check"
                />
            </CheckContainer>

            {children && <Label $isRed={variant === 'destructive'}>{children}</Label>}
        </Container>
    );
};
