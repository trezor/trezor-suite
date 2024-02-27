import { EventHandler, KeyboardEvent, ReactNode, SyntheticEvent } from 'react';
import styled from 'styled-components';
import { Color, borders } from '@trezor/theme';

import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { getFocusShadowStyle } from '../../../utils/utils';
import {
    CheckboxVariant,
    Label,
    LabelAlignment,
    variantStyles,
    Container,
    HiddenInput,
    CheckContainer,
} from '../Checkbox/Checkbox';

interface VariantStyles {
    borderChecked: Color;
    dotDisabledChecked: Color;
    borderDisabledChecked: Color;
}

const radioVariantStyles: Record<CheckboxVariant, VariantStyles> = {
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

    ::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${({ theme, variant }) => theme[variantStyles[variant].background]};
        transition: background 0.1s;
    }

    input:checked + && {
        background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        border-color: ${({ theme, variant }) => theme[radioVariantStyles[variant].borderChecked]};

        ::after {
            background: ${({ theme, variant }) => theme[variantStyles[variant].backgroundChecked]};
        }
    }

    input:disabled:not(:checked) + && {
        background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        border-color: ${({ theme, variant }) => theme[variantStyles[variant].borderDisabled]};

        ::after {
            background: transparent;
        }
    }

    input:disabled:checked + && {
        background: transparent;
        border-color: ${({ theme, variant }) =>
            theme[radioVariantStyles[variant].borderDisabledChecked]};

        ::after {
            background: ${({ theme, variant }) =>
                theme[radioVariantStyles[variant].dotDisabledChecked]};
        }
    }

    ${/* sc-selector */ Container}:hover input:not(:disabled):not(:checked) + && {
        ::after {
            background: ${({ theme, variant }) => theme[variantStyles[variant].backgroundHover]};
        }
    }

    &&& {
        ${getFocusShadowStyle()}
    }
`;

export interface RadioProps {
    variant?: CheckboxVariant;
    isChecked?: boolean;
    isDisabled?: boolean;
    labelAlignment?: LabelAlignment;
    onClick: EventHandler<SyntheticEvent>;
    'data-test'?: string;
    children?: ReactNode;
}

export const Radio = ({
    variant = 'primary',
    isChecked,
    labelAlignment,
    isDisabled,
    onClick,
    'data-test': dataTest,
    children,
}: RadioProps) => {
    const handleKeyUp = (event: KeyboardEvent<HTMLElement>) => {
        if (event.code === KEYBOARD_CODE.SPACE || event.code === KEYBOARD_CODE.ENTER) {
            onClick(event);
        }
    };

    return (
        <Container
            onClick={onClick}
            onKeyUp={handleKeyUp}
            isDisabled={isDisabled}
            labelAlignment={labelAlignment}
            data-checked={isChecked}
            data-test={dataTest}
        >
            <HiddenInput
                type="radio"
                checked={isChecked}
                disabled={isDisabled}
                readOnly
                tabIndex={-1}
            />

            <RadioIcon variant={variant} tabIndex={0} />

            {children && <Label isRed={variant === 'destructive'}>{children}</Label>}
        </Container>
    );
};
