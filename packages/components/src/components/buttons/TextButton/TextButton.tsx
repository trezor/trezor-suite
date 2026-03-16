import React from 'react';

import styled from 'styled-components';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';
import { Box } from '../../Box/Box';
import { Row } from '../../Flex/Flex';
import { Icon, type IconName } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { Text } from '../../typography/Text/Text';
import { type ButtonIntent, type ButtonPriority, type CommonButtonProps } from '../types';
import { type TextButtonSize } from './types';
import { mapIntentToCSS, mapSizeToGap, mapSizeToIconSize, mapSizeToTypographyStyle } from './utils';
import { pickButtonProps } from '../utils';

export const allowedTextButtonFrameProps = [
    'margin',
    'maxWidth',
    'width',
    'flex',
] as const satisfies FramePropsKeys[];
export type AllowedTextButtonFrameProps = Pick<
    FrameProps,
    (typeof allowedTextButtonFrameProps)[number]
>;

const TextButtonContainer = styled.button<
    TransientProps<AllowedTextButtonFrameProps> & {
        $intent: ButtonIntent;
        $priority: ButtonPriority;
        $isUnderlined: boolean;
        $isInverse: boolean;
        disabled: boolean;
    }
>`
    display: inline-flex;
    flex-shrink: 0;
    width: fit-content;
    border: 0;
    background: none;
    padding: 0;
    outline: 0;
    cursor: pointer;
    white-space: nowrap;
    max-width: 100%;
    -webkit-app-region: no-drag;
    transition: 0.1s ease-in-out;

    &:disabled {
        cursor: not-allowed;
    }

    ${({ $isUnderlined }) => $isUnderlined && 'text-decoration: underline;'}
    ${({ $intent, $priority, disabled, $isInverse, theme }) =>
        mapIntentToCSS($intent, $priority, $isInverse, disabled, theme)}

    ${withFrameProps}
`;

export type TextButtonProps = CommonButtonProps &
    AllowedTextButtonFrameProps & {
        iconLeft?: IconName;
        iconRight?: IconName;
        size?: TextButtonSize;
        children?: React.ReactNode;
        isUnderlined?: boolean;
        'data-testid'?: string;
    };

export const TextButton = ({
    iconLeft,
    iconRight,
    size = 'large',
    isUnderlined = false,
    children,
    'data-testid': dataTestId,
    ...props
}: TextButtonProps) => {
    const frameProps = pickAndPrepareFrameProps(props, allowedTextButtonFrameProps);
    const { intent, priority, isInverse, ...buttonProps } = pickButtonProps(props);
    const iconSize = mapSizeToIconSize(size);

    return (
        <TextButtonContainer
            $intent={intent}
            $priority={priority}
            $isInverse={isInverse}
            $isUnderlined={isUnderlined}
            data-testid={dataTestId}
            {...buttonProps}
            {...frameProps}
        >
            <Row gap={mapSizeToGap(size)} justifyContent="center" overflow="hidden" width="100%">
                {props.isLoading && (
                    <Spinner
                        isDisabled={true}
                        size={iconSize}
                        data-testid={`${dataTestId}/spinner`}
                    />
                )}
                {iconLeft && !props.isLoading && <Icon name={iconLeft} size={iconSize} />}
                <Box overflow="hidden">
                    <Text
                        as="div"
                        typographyStyle={mapSizeToTypographyStyle(size)}
                        ellipsisLineCount={1}
                    >
                        {children}
                    </Text>
                </Box>
                {(iconRight || buttonProps.target === '_blank') && (
                    <Icon name={iconRight ?? 'arrowLineUpRight'} size={iconSize} />
                )}
            </Row>
        </TextButtonContainer>
    );
};
