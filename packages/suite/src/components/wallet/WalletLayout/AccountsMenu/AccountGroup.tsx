import { type ReactNode, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Box, Column, Icon, Row, Text, useElevation } from '@trezor/components';
import { type Elevation, mapElevationToBackground, spacings, spacingsPx } from '@trezor/theme';

import { type Account } from 'src/types/wallet';

import { AnimationWrapper } from '../../AnimationWrapper';

const IconWrapper = styled.div<{ $isActive: boolean }>`
    padding: ${spacingsPx.xs};
    border-radius: 50%;
    transition:
        background 0.2s,
        transform 0.2s ease-in-out;
    transform: ${({ $isActive }) => ($isActive ? 'rotate(0)' : 'rotate(-90deg)')};
`;

const Header = styled.header<{ $elevation: Elevation }>`
    background-color: ${mapElevationToBackground};

    &:hover {
        ${IconWrapper} {
            background: ${({ theme }) => theme.surfaceFillRaised};
        }
    }
`;

interface AccountGroupProps {
    type: Account['accountType'];
    keepOpen: boolean;
    hasBalance: boolean;
    children?: ReactNode;
    onUpdate?: () => void;
    hideLabel?: boolean;
}

const getGroupLabel = (type: AccountGroupProps['type'], hideLabel?: boolean) => {
    if (hideLabel) return null;

    switch (type) {
        case 'normal':
            return 'TR_NORMAL_ACCOUNTS';
        case 'coinjoin':
            return 'TR_COINJOIN_ACCOUNTS';
        case 'taproot':
            return 'TR_TAPROOT_ACCOUNTS';
        case 'legacy':
            return 'TR_LEGACY_ACCOUNTS';
        case 'ledger':
            return 'TR_CARDANO_LEDGER_ACCOUNTS';
        default:
            return 'TR_LEGACY_SEGWIT_ACCOUNTS';
    }
};

export const AccountGroup = ({
    hasBalance,
    keepOpen,
    type,
    hideLabel,
    onUpdate,
    children,
}: AccountGroupProps) => {
    const [isOpen, setIsOpen] = useState(hasBalance || keepOpen);
    const [previouslyOpen, setPreviouslyOpen] = useState(isOpen); // used to follow props changes without unnecessary rerenders
    const [previouslyHasBalance, setPreviouslyHasBalance] = useState(hasBalance); // used to follow props changes without unnecessary rerenders
    const { elevation } = useElevation();

    if (keepOpen && !previouslyOpen) {
        setPreviouslyOpen(true);
        setIsOpen(true);
    }

    if (hasBalance && !previouslyHasBalance) {
        setPreviouslyHasBalance(true);
        setIsOpen(true);
    }

    const onClick = () => {
        setIsOpen(!isOpen);
        if (isOpen) {
            setPreviouslyOpen(false);
        }
    };

    const heading = getGroupLabel(type, hideLabel);

    return (
        <Column gap={spacings.xxxs}>
            {heading !== null && (
                <Box
                    position={{ type: 'sticky', top: 0 }}
                    zIndex={30}
                    cursor={!keepOpen ? 'pointer' : 'default'}
                >
                    <Header
                        onClick={!keepOpen ? onClick : undefined}
                        data-testid={`@account-menu/${type}`}
                        $elevation={elevation}
                    >
                        <Row
                            gap={spacings.sm}
                            margin={{ horizontal: spacings.sm }}
                            padding={{ left: keepOpen ? spacings.xxl : undefined }}
                            minHeight={spacings.xxxl}
                        >
                            {!keepOpen && (
                                <IconWrapper $isActive={isOpen}>
                                    <Icon
                                        data-testid="@account-menu/arrow"
                                        size={16}
                                        intent="neutral"
                                        priority="secondary"
                                        name="caretDown"
                                    />
                                </IconWrapper>
                            )}
                            <Text
                                intent="neutral"
                                priority="secondary"
                                typographyStyle="body-xs"
                                margin={{ left: keepOpen ? spacings.sm : undefined }}
                                // Optical fix
                                position={{ type: 'relative', left: 1 }}
                            >
                                <Translation id={heading} />
                            </Text>
                        </Row>
                    </Header>
                </Box>
            )}

            <AnimationWrapper opened={isOpen} onUpdate={onUpdate}>
                <Column
                    gap={spacings.xxs}
                    margin={{ top: spacings.xxxs, left: spacings.xs, right: spacings.xs }}
                    data-testid={`@account-menu/${type}/group`}
                >
                    {children}
                </Column>
            </AnimationWrapper>
        </Column>
    );
};
