import { useState, forwardRef, useRef, Ref, ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { Icon } from '@trezor/components';
import { Account } from 'src/types/wallet';
import { AnimationWrapper } from './AnimationWrapper';
import { spacingsPx, typography } from '@trezor/theme';

const Container = styled.div`
    padding: ${spacingsPx.xs};
`;

const HeaderWrapper = styled.div`
    position: sticky;
    top: 0;

    /* to not overlap with the Account's focus shadow */
    margin-bottom: ${spacingsPx.xxs};
    z-index: 1;
`;

const ChevronContainer = styled.div`
    width: ${spacingsPx.xxxl};
`;

const ChevronIcon = styled(Icon)<{ isActive: boolean }>`
    padding: ${spacingsPx.sm};
    border-radius: 50%;
    transition:
        background 0.2s,
        transform 0.2s ease-in-out;
    transform: ${({ isActive }) => (isActive ? 'rotate(0)' : 'rotate(-90deg)')};
`;

const Header = styled.header<{ isOpen: boolean; onClick?: () => void }>`
    display: flex;
    padding: ${spacingsPx.xs};
    cursor: ${props => (props.onClick ? 'pointer' : 'default')};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    align-items: center;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};

    :hover {
        ${ChevronIcon} {
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

export const AccountGroup = forwardRef(
    (
        { hasBalance, keepOpen, type, hideLabel, onUpdate, children }: AccountGroupProps,
        _ref: Ref<HTMLDivElement>,
    ) => {
        const theme = useTheme();
        const wrapperRef = useRef<HTMLDivElement>(null);
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

        // Group needs to be wrapped into container (div)

        const heading = getGroupLabel(type, hideLabel);
        return (
            <Container ref={wrapperRef}>
                <HeaderWrapper>
                    {heading !== null && (
                        <Header
                            isOpen={isOpen}
                            onClick={!keepOpen ? onClick : undefined}
                            data-test={`@account-menu/${type}`}
                        >
                            <ChevronContainer>
                                {!keepOpen && (
                                    <ChevronIcon
                                        data-test="@account-menu/arrow"
                                        isActive={isOpen}
                                        size={18}
                                        color={theme.iconSubdued}
                                        icon="ARROW_DOWN"
                                    />
                                )}
                            </ChevronContainer>
                            <Translation id={heading} />
                        </Header>
                    )}
                </HeaderWrapper>

                <AnimationWrapper
                    opened={isOpen}
                    onUpdate={onUpdate}
                    dataTest={`@account-menu/${type}/group`}
                >
                    {children}
                </AnimationWrapper>
            </Container>
        );
    },
);
