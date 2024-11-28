import { useState, ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Icon, Column, Text, Row } from '@trezor/components';
import { spacingsPx, spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';

import { AnimationWrapper } from '../../AnimationWrapper';

const IconWrapper = styled.div<{ $isActive: boolean; $isVisible: boolean }>`
    padding: ${spacingsPx.xs};
    border-radius: 50%;
    transition:
        background 0.2s,
        transform 0.2s ease-in-out;
    transform: ${({ $isActive }) => ($isActive ? 'rotate(0)' : 'rotate(-90deg)')};

    ${({ $isVisible }) =>
        !$isVisible &&
        css`
            pointer-events: none;
            opacity: 0;
        `}
`;

const Header = styled.header<{ $isOpen: boolean; onClick?: () => void }>`
    position: sticky;
    top: 0;
    z-index: 30;
    cursor: ${props => (props.onClick ? 'pointer' : 'default')};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};

    &:hover {
        ${IconWrapper} {
            background: ${({ theme }) => theme.backgroundSurfaceElevation1};
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
                <Header
                    $isOpen={isOpen}
                    onClick={!keepOpen ? onClick : undefined}
                    data-testid={`@account-menu/${type}`}
                >
                    <Row
                        gap={spacings.sm}
                        margin={{ horizontal: spacings.sm, vertical: spacings.xxs }}
                    >
                        <IconWrapper $isActive={isOpen} $isVisible={!keepOpen}>
                            <Icon
                                data-testid="@account-menu/arrow"
                                size={17}
                                variant="tertiary"
                                name="chevronDown"
                            />
                        </IconWrapper>
                        <Text variant="tertiary" typographyStyle="label">
                            <Translation id={heading} />
                        </Text>
                    </Row>
                </Header>
            )}

            <AnimationWrapper opened={isOpen} onUpdate={onUpdate}>
                <Column
                    gap={spacings.xxs}
                    margin={{ left: spacings.xs, right: spacings.xs }}
                    data-testid={`@account-menu/${type}/group`}
                >
                    {children}
                </Column>
            </AnimationWrapper>
        </Column>
    );
};
