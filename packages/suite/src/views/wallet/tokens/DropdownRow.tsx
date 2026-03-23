import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { Badge, Icon, Row, Text, type TextProps } from '@trezor/components';
import { type TypographyStyle, spacings } from '@trezor/theme';

import { HiddenPlaceholder } from 'src/components/suite';

const IconWrapper = styled.div<{ $isActive: boolean }>`
    transition: transform 0.2s ease-in-out;
    transform: ${({ $isActive }) => ($isActive ? 'rotate(0)' : 'rotate(-90deg)')};
`;

const DropdownRowToggle = styled.div`
    user-select: none;
`;

type DropdownRowProps = {
    isActive: boolean;
    text?: TranslationKey;
    typographyStyle?: TypographyStyle;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
    shouldDisplayIcon?: boolean;
    nftName?: ReactNode;
    nftItemsCount?: number;
};

export const DropdownRow = ({
    isActive,
    typographyStyle = 'body-md',
    intent = 'neutral',
    priority = 'secondary',
    isDisabled = false,
    text,
    shouldDisplayIcon = true,
    nftName,
    nftItemsCount,
}: DropdownRowProps) => (
    <DropdownRowToggle>
        <Row gap={spacings.xs}>
            {shouldDisplayIcon && (
                <IconWrapper $isActive={isActive}>
                    <Icon size={18} intent="neutral" priority="secondary" name="caretDown" />
                </IconWrapper>
            )}
            {nftName ? (
                <HiddenPlaceholder>
                    <Row gap={spacings.xs}>
                        <Text textWrap="nowrap">{nftName}</Text>
                        {nftItemsCount && <Badge size="small">{nftItemsCount}</Badge>}
                    </Row>
                </HiddenPlaceholder>
            ) : (
                text && (
                    <Text
                        typographyStyle={typographyStyle}
                        intent={intent}
                        priority={priority}
                        isDisabled={isDisabled}
                    >
                        <Translation id={text} />
                    </Text>
                )
            )}
        </Row>
    </DropdownRowToggle>
);
