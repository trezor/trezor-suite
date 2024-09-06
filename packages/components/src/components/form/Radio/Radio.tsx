import { EventHandler, KeyboardEvent, ReactNode, SyntheticEvent } from 'react';
import styled from 'styled-components';
import { Color, borders } from '@trezor/theme';

import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { getFocusShadowStyle } from '../../../utils/utils';
import {
    Label,
    LabelAlignment,
    VerticalAlignment,
    variantStyles,
    Container,
    HiddenInput,
    CheckContainer,
    AllowedCheckboxFrameProps,
    allowedCheckboxFrameProps,
} from '../Checkbox/Checkbox';
import { UIVariant } from '../../../config/types';
import { pickAndPrepareFrameProps } from '../../../utils/frameProps';

interface VariantStyles {
    borderChecked: Color;
    dotDisabledChecked: Color;
    borderDisabledChecked: Color;
}

export const radioVariants = ['primary', 'destructive', 'warning'] as const;
export type RadioVariant = Extract<UIVariant, (typeof radioVariants)[number]>;

const radioVariantStyles: Record<RadioVariant, VariantStyles> = {
    primary: {
        borderChecked: 'backgroundSecondaryDefault',
        dotDisabledChecked: 'backgroundPrimarySubtleOnElevation0',
        borderDisabledChecked: 'backgroundPrimarySubtleOnElevation1',
    },
    destructive: {
        borderChecked: 'backgroundAlertRedSubtleOnElevation0',
        dotDisabledChecked: 'backgroundAlertRedSubtleOnElevation0',
        borderDisabledChecked: 'backgroundAlertRedSubtleOnElevation1',
    },
    warning: {
        borderChecked: 'backgroundAlertYellowSubtleOnElevation0',
        dotDisabledChecked: 'backgroundAlertYellowSubtleOnElevation0',
        borderDisabledChecked: 'backgroundAlertYellowSubtleOnElevation1',
    },
};

const RadioIcon = styled(CheckContainer)`
    position: relative;
    border-radius: ${borders.radii.full};

    &::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${({ theme, $variant }) => theme[variantStyles[$variant].background]};
        transition: background 0.1s;
    }

    input:checked + & {
        background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        border-color: ${({ theme, $variant }) => theme[radioVariantStyles[$variant].borderChecked]};

        &::after {
            background: ${({ theme, $variant }) =>
                theme[variantStyles[$variant].backgroundChecked]};
        }
    }

    input:disabled + & {
        cursor: not-allowed;
    }

    input:disabled:not(:checked) + & {
        background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        border-color: ${({ theme, $variant }) => theme[variantStyles[$variant].borderDisabled]};

        &::after {
            background: transparent;
        }
    }

    input:disabled:checked + & {
        background: transparent;
        border-color: ${({ theme, $variant }) =>
            theme[radioVariantStyles[$variant].borderDisabledChecked]};

        &::after {
            background: ${({ theme, $variant }) =>
                theme[radioVariantStyles[$variant].dotDisabledChecked]};
        }
    }

    ${/* sc-selector */ Container}:hover input:not(:disabled):not(:checked) + & {
        &::after {
            background: ${({ theme, $variant }) => theme[variantStyles[$variant].backgroundHover]};
        }
    }

    ${getFocusShadowStyle()}
`;

export type RadioProps = AllowedCheckboxFrameProps & {
    variant?: RadioVariant;
    isChecked?: boolean;
    isDisabled?: boolean;
    labelAlignment?: LabelAlignment;
    verticalAlignment?: VerticalAlignment;
    onClick: EventHandler<SyntheticEvent>;
    'data-testid'?: string;
    children?: ReactNode;
};

export const Radio = ({
    variant = 'primary',
    isChecked,
    labelAlignment = 'right',
    verticalAlignment = 'top',
    isDisabled = false,
    onClick,
    'data-testid': dataTest,
    children,
    ...rest
}: RadioProps) => {
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
            onClick={isDisabled ? undefined : onClick}
            onKeyUp={handleKeyUp}
            $isDisabled={isDisabled}
            $labelAlignment={labelAlignment}
            $verticalAlignment={verticalAlignment}
            data-checked={isChecked}
            data-testid={dataTest}
            {...frameProps}
        >
            <HiddenInput
                type="radio"
                checked={isChecked}
                disabled={isDisabled}
                readOnly
                tabIndex={-1}
            />

            <RadioIcon $variant={variant} tabIndex={0} />

            {children && <Label $isRed={variant === 'destructive'}>{children}</Label>}
        </Container>
    );
};
