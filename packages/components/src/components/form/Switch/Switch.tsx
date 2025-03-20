import { ReactNode, useId } from 'react';

import styled, { css } from 'styled-components';

import { borders } from '@trezor/theme';

import {
    mapSizeToContainerHeight,
    mapSizeToContainerWidth,
    mapSizeToHandleSize,
    mapSizeToLabelContainerGap,
    mapSizeToLabelTypography,
} from './switchUtils';
import { UIAlignment, type UISize } from '../../../config/types';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import {
    focusStyleTransition,
    getFocusShadowStyle,
    getInputColor,
    getLabelColor,
} from '../../../utils/utils';

export const allowedSwitchFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSwitchFrameProps)[number]>;

export const labelPositions = ['start', 'end'] as const;
export type LabelPosition = Extract<UIAlignment, (typeof labelPositions)[number]>;

export type SwitchProps = AllowedFrameProps & {
    isChecked: boolean;
    label?: ReactNode;
    onChange: (isChecked: boolean) => void;
    isDisabled?: boolean;
    isAlert?: boolean;
    size?: SwitchSize;
    className?: string;
    'data-testid'?: string;
    labelPosition?: LabelPosition;
};

export const switchSizes = ['medium', 'small'] as const;
export type SwitchSize = Extract<UISize, (typeof switchSizes)[number]>;

const Wrapper = styled.div<
    {
        $labelPosition?: Extract<UIAlignment, 'start' | 'end'>;
        $size: SwitchSize;
    } & TransientProps<AllowedFrameProps>
>`
    display: flex;
    align-items: center;
    gap: ${mapSizeToLabelContainerGap};
    flex-direction: ${({ $labelPosition }) => ($labelPosition === 'start' ? 'row-reverse' : 'row')};

    ${withFrameProps}
`;

const Container = styled.div<{
    $isChecked: boolean;
    $isDisabled?: boolean;
    $isAlert?: boolean;
    $size: SwitchSize;
}>`
    display: flex;
    align-items: center;
    width: ${mapSizeToContainerWidth};
    height: ${mapSizeToContainerHeight};
    flex-shrink: 0;
    margin: 0;
    padding: 3px;
    position: relative;
    background: ${({ $isChecked, $isDisabled, theme }) =>
        getInputColor(theme, { checked: $isChecked, disabled: $isDisabled })};
    border-radius: ${borders.radii.sm};
    transition:
        background 0.2s ease 0s,
        ${focusStyleTransition};
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
    box-sizing: border-box;
    border: 1px solid
        ${({ theme, $isAlert }) => `${$isAlert ? theme.borderAlertRed : 'transparent'}`};

    button {
        box-shadow: ${({ theme }) => theme.boxShadowBase};
        opacity: ${({ $isDisabled }) => $isDisabled && 0.66};
    }

    ${({ $isDisabled, theme, $isChecked }) =>
        !$isDisabled &&
        css`
            ${getFocusShadowStyle(':focus-within:has(:focus-visible)')}

            :focus-within:has(:focus-visible) {
                background: ${$isChecked
                    ? theme.stateFillElementBrandBoldActiveHovered
                    : theme.stateFillElementNeutralBoldHovered};
            }

            &:hover {
                background: ${$isChecked
                    ? theme.stateFillElementBrandBoldActiveHovered
                    : theme.stateFillElementNeutralBoldHovered};
            }
        `};
`;

const Handle = styled.button<{
    $isDisabled?: boolean;
    $isChecked: boolean;
    $size: SwitchSize;
}>`
    position: absolute;
    display: inline-block;
    height: ${mapSizeToHandleSize};
    width: ${mapSizeToHandleSize};
    border: none;
    left: 1px;
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.baseContentReversePrimary};
    transform: ${({ $isChecked, $size }) =>
        $isChecked && `translateX(${mapSizeToHandleSize({ $size })})`};
    transition: transform 0.25s ease 0s;
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
`;

const CheckboxInput = styled.input`
    border: 0;
    clip: rect(0, 0, 0, 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
`;

const Label = styled.label<{
    $isDisabled?: boolean;
    $isAlert?: boolean;
    $size: SwitchSize;
}>`
    color: ${({ $isAlert, $isDisabled, theme }) =>
        getLabelColor(theme, { alert: $isAlert, disabled: $isDisabled })};
    ${mapSizeToLabelTypography}
`;

export const Switch = ({
    onChange,
    isDisabled = false,
    isAlert,
    size = 'medium',
    label,
    'data-testid': dataTest,
    isChecked,
    className,
    labelPosition = 'end',
    ...rest
}: SwitchProps) => {
    const id = useId();
    const frameProps = pickAndPrepareFrameProps(rest, allowedSwitchFrameProps);

    const handleChange = () => {
        if (isDisabled) return;
        onChange(!isChecked);
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent handling clicks that originate from the input or label
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'LABEL') return;

        e.preventDefault();
        handleChange();
    };

    return (
        <Wrapper $labelPosition={labelPosition} $size={size} {...frameProps}>
            <Container
                // @ts-expect-error - needed for cypress retry-ability
                disabled={isDisabled}
                $isChecked={isChecked}
                $isDisabled={isDisabled}
                $isAlert={isAlert}
                onClick={handleContainerClick}
                data-testid={dataTest}
                $size={size}
            >
                <Handle
                    tabIndex={-1}
                    $isChecked={isChecked}
                    $isDisabled={isDisabled}
                    type="button"
                    $size={size}
                />
                <CheckboxInput
                    id={id}
                    type="checkbox"
                    role="switch"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={handleChange}
                    aria-checked={isChecked}
                />
            </Container>

            {label && (
                <Label $isDisabled={isDisabled} $isAlert={isAlert} $size={size} htmlFor={id}>
                    {label}
                </Label>
            )}
        </Wrapper>
    );
};
