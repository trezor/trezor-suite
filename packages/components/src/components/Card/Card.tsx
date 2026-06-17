import { type HTMLAttributes, type ReactNode } from 'react';

import styled from 'styled-components';

import { borders } from '@trezor/theme';

import { type CardType, type PaddingType } from './types';
import { mapCardTypeToCSS, mapPaddingTypeToPadding } from './utils';
import { type AccessibilityProps, withAccessibilityProps } from '../../utils/accessibilityProps';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { commonFocusStyles } from '../../utils/utils';
import { Box } from '../Box/Box';
import { Divider } from '../Divider/Divider';
import { Text } from '../typography/Text/Text';

export const allowedCardFrameProps = [
    'margin',
    'width',
    'maxWidth',
    'minWidth',
    'height',
    'minHeight',
    'maxHeight',
    'overflow',
    'flex',
    'zIndex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCardFrameProps)[number]>;

type TransientAllowedFrameProps = TransientProps<AllowedFrameProps>;

type ContainerProps = {
    $type: CardType;
    $isClickable: boolean;
    $isSelected: boolean;
};

const Container = styled.section<ContainerProps & TransientAllowedFrameProps>`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    border-radius: ${borders.radii.md};
    overflow: hidden;
    cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};
    transition: 0.2s ease-in-out;

    &:focus-visible {
        ${commonFocusStyles}
    }

    ${mapCardTypeToCSS}
    ${withFrameProps}
`;

export type CardProps = AccessibilityProps &
    AllowedFrameProps & {
        header?: ReactNode;
        footer?: ReactNode;
        paddingType?: PaddingType;
        type?: CardType;
        onMouseEnter?: HTMLAttributes<HTMLDivElement>['onMouseEnter'];
        onMouseLeave?: HTMLAttributes<HTMLDivElement>['onMouseLeave'];
        onClick?: HTMLAttributes<HTMLDivElement>['onClick'];
        children?: ReactNode;
        isSelected?: boolean;
        'data-testid'?: string;
    };

export const Card = ({
    paddingType = 'normal',
    type = 'raised',
    header,
    footer,
    onClick,
    onMouseEnter,
    onMouseLeave,
    tabIndex,
    children,
    isSelected = false,
    'data-testid': dataTest,
    ...rest
}: CardProps) => {
    const frameProps = pickAndPrepareFrameProps(
        rest,
        allowedCardFrameProps,
    ) as TransientAllowedFrameProps;
    const isClickable = Boolean(onClick);

    return (
        <Container
            $type={type}
            $isClickable={isClickable}
            $isSelected={isClickable && isSelected}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            data-testid={dataTest}
            {...frameProps}
            {...withAccessibilityProps({
                tabIndex: (tabIndex ?? Boolean(onClick)) ? 0 : undefined,
            })}
        >
            {header && (
                <>
                    <Box
                        padding={mapPaddingTypeToPadding({
                            paddingType,
                        })}
                    >
                        <Text as="div" typographyStyle="body-sm-strong">
                            {header}
                        </Text>
                    </Box>
                    <Divider margin={{}} />
                </>
            )}
            <Box
                padding={mapPaddingTypeToPadding({
                    paddingType,
                })}
                flex="1"
            >
                {children}
            </Box>
            {footer && (
                <>
                    <Divider margin={{}} />
                    <Box padding={mapPaddingTypeToPadding({ paddingType })}>{footer}</Box>
                </>
            )}
        </Container>
    );
};
