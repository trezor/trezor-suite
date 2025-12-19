import React from 'react';

import styled from 'styled-components';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { Box } from '../../Box/Box';
import { Row } from '../../Flex/Flex';
import { Icon, IconName } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { Text } from '../../typography/Text/Text';
import { ButtonIntent, CommonButtonProps } from '../types';
import { TextButtonSize } from './types';
import { mapIntentToCSS, mapSizeToIconSize, mapSizeToTypographyStyle } from './utils';
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
        $isUnderlined: boolean;
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
    ${({ $intent, disabled, theme }) => mapIntentToCSS($intent, disabled, theme)}

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
    intent = 'brand',
    'data-testid': dataTestId,
    ...props
}: TextButtonProps) => {
    const frameProps = pickAndPrepareFrameProps(props, allowedTextButtonFrameProps);
    const buttonProps = pickButtonProps(props);
    const iconSize = mapSizeToIconSize(size);

    return (
        <TextButtonContainer
            $intent={intent}
            $isUnderlined={isUnderlined}
            data-testid={dataTestId}
            {...buttonProps}
            {...frameProps}
        >
            <Row gap={8} justifyContent="center" overflow="hidden" width="100%">
                {props.isLoading && (
                    <Spinner isGrey={true} size={iconSize} data-testid={`${dataTestId}/spinner`} />
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
                {iconRight && !props.isLoading && <Icon name={iconRight} size={iconSize} />}
            </Row>
        </TextButtonContainer>
    );
};
