import { useState, forwardRef, useRef, Ref, ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { Icon, variables } from '@trezor/components';
import { Account } from 'src/types/wallet';
import { AnimationWrapper } from './AnimationWrapper';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.BG_WHITE};
`;

const HeaderWrapper = styled.div`
    position: sticky;
    top: 0;
    background: ${({ theme }) => theme.BG_WHITE};
`;

const ChevronIcon = styled(Icon)`
    padding: 12px;
    border-radius: 50%;
    transition: background 0.2s;
`;

const Header = styled.header<{ isOpen: boolean; onClick?: () => void }>`
    display: flex;
    padding: 16px;
    cursor: ${props => (props.onClick ? 'pointer' : 'default')};
    justify-content: space-between;
    align-items: center;
    height: 50px; /* otherwise it jumps on hiding arrow_down/up icon */

    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};

    :hover {
        ${ChevronIcon} {
            background: ${({ theme }) => theme.BG_GREY};
        }
    }
`;

interface AccountGroupProps {
    type: Account['accountType'];
    keepOpen: boolean;
    hasBalance: boolean;
    children?: ReactNode;
    onUpdate?: () => void;
}

const getGroupLabel = (type: AccountGroupProps['type']) => {
    if (type === 'normal') return 'TR_NORMAL_ACCOUNTS';
    if (type === 'coinjoin') return 'TR_COINJOIN_ACCOUNTS';
    if (type === 'taproot') return 'TR_TAPROOT_ACCOUNTS';
    if (type === 'legacy') return 'TR_LEGACY_ACCOUNTS';
    if (type === 'ledger') return 'TR_CARDANO_LEDGER_ACCOUNTS';
    return 'TR_LEGACY_SEGWIT_ACCOUNTS';
};

export const AccountGroup = forwardRef((props: AccountGroupProps, _ref: Ref<HTMLDivElement>) => {
    const theme = useTheme();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(props.hasBalance || props.keepOpen);
    const [previouslyOpen, setPreviouslyOpen] = useState(isOpen); // used to follow props changes without unnecessary rerenders
    const [previouslyHasBalance, setPreviouslyHasBalance] = useState(props.hasBalance); // used to follow props changes without unnecessary rerenders
    const [animatedIcon, setAnimatedIcon] = useState(false);

    if (props.keepOpen && !previouslyOpen) {
        setPreviouslyOpen(true);
        setIsOpen(true);
    }

    if (props.hasBalance && !previouslyHasBalance) {
        setPreviouslyHasBalance(true);
        setIsOpen(true);
    }

    const onClick = () => {
        setIsOpen(!isOpen);
        setAnimatedIcon(true);
        if (isOpen) {
            setPreviouslyOpen(false);
        }
    };

    // Group needs to be wrapped into container (div)
    return (
        <Wrapper ref={wrapperRef}>
            <HeaderWrapper>
                <Header
                    isOpen={isOpen}
                    onClick={!props.keepOpen ? onClick : undefined}
                    data-test={`@account-menu/${props.type}`}
                >
                    <Translation id={getGroupLabel(props.type)} />
                    {!props.keepOpen && (
                        <ChevronIcon
                            data-test="@account-menu/arrow"
                            canAnimate={animatedIcon}
                            isActive={isOpen}
                            size={16}
                            color={theme.TYPE_LIGHT_GREY}
                            icon="ARROW_DOWN"
                        />
                    )}
                </Header>
            </HeaderWrapper>
            <AnimationWrapper opened={isOpen} onUpdate={props.onUpdate}>
                {props.children}
            </AnimationWrapper>
        </Wrapper>
    );
});
