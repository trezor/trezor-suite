import type { ReactNode } from 'react';

import styled from 'styled-components';

import type { TextVariant } from '@trezor/components';
import { Badge, Icon, Row, Text } from '@trezor/components';
import type { TypographyStyle } from '@trezor/theme';
import { spacings } from '@trezor/theme';

import { HiddenPlaceholder } from 'src/components/suite';
import type { TranslationKey } from 'src/components/suite/Translation';
import { Translation } from 'src/components/suite/Translation';

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
    variant?: TextVariant;
    shouldDisplayIcon?: boolean;
    nftName?: ReactNode;
    nftItemsCount?: number;
};

export const DropdownRow = ({
    isActive,
    typographyStyle = 'body',
    variant = 'tertiary',
    text,
    shouldDisplayIcon = true,
    nftName,
    nftItemsCount,
}: DropdownRowProps) => (
    <DropdownRowToggle>
        <Row gap={spacings.xs}>
            {shouldDisplayIcon && (
                <IconWrapper $isActive={isActive}>
                    <Icon size={18} variant="tertiary" name="caretDown" />
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
                    <Text typographyStyle={typographyStyle} variant={variant}>
                        <Translation id={text} />
                    </Text>
                )
            )}
        </Row>
    </DropdownRowToggle>
);
