import { useState, ReactNode } from 'react';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Icon, Column } from '@trezor/components';
import { Account } from 'src/types/wallet';
import { AnimationWrapper } from '../../AnimationWrapper';
import { spacingsPx, spacings, typography } from '@trezor/theme';

const ICON_SIZE = 18;

const IconWrapper = styled.div<{ $isActive: boolean }>`
    padding: ${spacingsPx.xs};
    border-radius: 50%;
    transition:
        background 0.2s,
        transform 0.2s ease-in-out;
    transform: ${({ $isActive }) => ($isActive ? 'rotate(0)' : 'rotate(-90deg)')};
`;

const Header = styled.header<{ $isOpen: boolean; onClick?: () => void }>`
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    gap: ${spacings.sm - 1}px;
    padding: 0 ${spacingsPx.sm};
    cursor: ${props => (props.onClick ? 'pointer' : 'default')};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    align-items: center;
    color: ${({ theme }) => theme.textSubdued};
    min-height: 40px;
    ${typography.label}

    &:hover {
        ${IconWrapper} {
            background: ${({ theme }) => theme.backgroundSurfaceElevation1};
        }
    }
`;

const HeadingWrapper = styled.div`
    &:only-child {
        padding-left: ${spacings.sm + spacings.md + ICON_SIZE - 1}px;
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
        <div>
            {heading !== null && (
                <Header
                    $isOpen={isOpen}
                    onClick={!keepOpen ? onClick : undefined}
                    data-testid={`@account-menu/${type}`}
                >
                    {!keepOpen && (
                        <IconWrapper $isActive={isOpen}>
                            <Icon
                                data-testid="@account-menu/arrow"
                                size={ICON_SIZE}
                                variant="tertiary"
                                name="chevronDown"
                            />
                        </IconWrapper>
                    )}
                    <HeadingWrapper>
                        <Translation id={heading} />
                    </HeadingWrapper>
                </Header>
            )}

            <AnimationWrapper
                opened={isOpen}
                onUpdate={onUpdate}
                data-testid={`@account-menu/${type}/group`}
            >
                <Column
                    alignItems="stretch"
                    gap={spacings.xxs}
                    margin={{ left: spacings.xs, right: spacings.xs }}
                >
                    {children}
                </Column>
            </AnimationWrapper>
        </div>
    );
};
