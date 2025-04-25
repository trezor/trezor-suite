import { ReactNode, useId } from 'react';

import styled, { css } from 'styled-components';

import { borders, spacings } from '@trezor/theme';

import { type SwitchLabelPosition, type SwitchSize } from './types';
import { mapSizeToHandleSize, mapSizeToLabelContainerGap, mapSizeToLabelTypography } from './utils';
import { FrameProps, FramePropsKeys } from '../../../utils/frameProps';
import { focusStyleTransition, getFocusShadowStyle } from '../../../utils/utils';
import { Box } from '../../Box/Box';
import { Row } from '../../Flex/Flex';
import { Text } from '../../typography/Text/Text';

export const allowedSwitchFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSwitchFrameProps)[number]>;

export type SwitchProps = AllowedFrameProps & {
    isChecked: boolean;
    label?: ReactNode;
    onChange: (isChecked: boolean) => void;
    isDisabled?: boolean;
    size?: SwitchSize;
    'data-testid'?: string;
    labelPosition?: SwitchLabelPosition;
};

const Container = styled.div<{
    $isChecked: boolean;
    $isDisabled?: boolean;
}>`
    position: relative;
    flex-shrink: 0;
    border-radius: ${borders.radii.full};
    transition:
        background 0.2s ease 0s,
        ${focusStyleTransition};
    cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};

    ${({ $isDisabled, theme, $isChecked }) =>
        $isDisabled
            ? css`
                  background: ${$isChecked
                      ? theme.stateFillElementBrandBoldActiveDisabled
                      : theme.stateFillElementBoldDisabled};
              `
            : css`
                  background: ${$isChecked
                      ? theme.stateFillElementBrandBoldActive
                      : theme.baseFillElementNeutralBold};

                  :focus-within:has(:focus-visible),
                  &:hover {
                      background: ${$isChecked
                          ? theme.stateFillElementBrandBoldActiveHovered
                          : theme.stateFillElementNeutralBoldHovered};
                  }

                  ${getFocusShadowStyle(':focus-within:has(:focus-visible)')}
              `};
`;

const Handle = styled.button<{ $isChecked: boolean }>`
    display: block;
    height: 100%;
    aspect-ratio: 1;
    border: none;
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.baseContentReversePrimary};
    transform: ${({ $isChecked }) => $isChecked && `translateX(100%)`};
    transition: transform 0.25s ease 0s;
    pointer-events: none;
    box-shadow: ${({ theme }) => theme.boxShadowBase};
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

export const Switch = ({
    onChange,
    isDisabled = false,
    size = 'medium',
    label,
    'data-testid': dataTest,
    isChecked,
    labelPosition = 'end',
    margin,
}: SwitchProps) => {
    const id = useId();

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
        <Row
            gap={mapSizeToLabelContainerGap(size)}
            isReversed={labelPosition === 'start'}
            margin={margin}
        >
            <Container
                // @ts-expect-error - needed for cypress retry-ability
                disabled={isDisabled}
                $isChecked={isChecked}
                $isDisabled={isDisabled}
                onClick={handleContainerClick}
                data-testid={dataTest}
            >
                <Box
                    height={mapSizeToHandleSize(size)}
                    aspectRatio="2 / 1"
                    margin={spacings.xxxs}
                    opacity={isDisabled ? 0.66 : 1}
                >
                    <Handle tabIndex={-1} $isChecked={isChecked} type="button" />
                </Box>
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
                <label htmlFor={id}>
                    <Text
                        variant={isDisabled ? 'disabled' : 'tertiary'}
                        typographyStyle={mapSizeToLabelTypography(size)}
                        cursor={isDisabled ? undefined : 'pointer'}
                    >
                        {label}
                    </Text>
                </label>
            )}
        </Row>
    );
};
