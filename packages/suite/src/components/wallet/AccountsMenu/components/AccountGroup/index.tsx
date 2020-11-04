import React, { useState, forwardRef, useRef } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { useTheme, Icon, variables } from '@trezor/components';
import { Account } from '@wallet-types';
import AnimationWrapper from '../AnimationWrapper';

const Wrapper = styled.div`
    background: ${props => props.theme.BG_WHITE};
`;

const HeaderWrapper = styled.div`
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${props => props.theme.BG_WHITE};
`;

const Header = styled.header<{ onClick?: () => void }>`
    display: flex;
    padding: 16px;
    cursor: ${props => (props.onClick ? 'pointer' : 'default')};
    justify-content: space-between;
    align-items: center;
    height: 50px; /* otherwise it jumps on hiding arrow_down/up icon */

    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

interface Props {
    type: Account['accountType'];
    keepOpened: boolean;
    hasBalance: boolean;
    children?: React.ReactNode;
    onUpdate?: () => void;
    // onAnimationStart?: () => void;
    // animate?: boolean;
    // onAnimationComplete?: () => void;
}

export default forwardRef((props: Props, _ref: React.Ref<HTMLDivElement>) => {
    const theme = useTheme();
    const hasHeader = props.type !== 'normal';
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(props.hasBalance || props.keepOpened || !hasHeader);
    const isOpened = expanded || props.keepOpened || !hasHeader;
    const [animatedIcon, setAnimatedIcon] = useState(false); // TODO: move animation to framer
    // React.useEffect(() => {
    //     console.log('====>FIRST TIME, MOVE ME UP');
    // }, [animatedIcon]);

    React.useEffect(() => {
        // follow props change (example: add new coin/account which has balance but group is closed)
        if (props.keepOpened || props.hasBalance) {
            setExpanded(true);
        }
    }, [props.keepOpened, props.hasBalance]);

    if (!props.children || React.Children.count(props.children) === 0) return null;

    const onClick = () => {
        setExpanded(!expanded);
        setAnimatedIcon(true);
    };

    // const onAnimationStart = () => {
    //     console.warn('::onAnimationStart', props.type, isOpened);
    //     props.onAnimationStart(props.type, isOpened);
    // };

    // const onAnimationComplete = () => {
    //     console.warn('::onAnimationComplete', props.type, isOpened);
    //     props.onAnimationComplete(props.type, isOpened);
    //     if (wrapperRef.current && !expanded) {
    //         wrapperRef.current.scrollIntoView({
    //             behavior: 'smooth',
    //             block: 'start',
    //         });
    //     }
    // };

    // if (props.type === 'segwit') {
    //     console.warn('GROUP STATE!', expanded, props.opened);
    // }

    // Group needs to be wrapped into container (div)
    return (
        <Wrapper ref={wrapperRef}>
            {hasHeader && (
                <HeaderWrapper>
                    <Header
                        onClick={!props.keepOpened ? onClick : undefined}
                        data-test={`@account-menu/${props.type}`}
                    >
                        <Translation
                            id={
                                props.type === 'legacy'
                                    ? 'TR_LEGACY_ACCOUNTS'
                                    : 'TR_SEGWIT_ACCOUNTS'
                            }
                        />
                        {!props.keepOpened && (
                            <Icon
                                canAnimate={animatedIcon}
                                isActive={isOpened}
                                size={16}
                                color={theme.TYPE_LIGHT_GREY}
                                icon="ARROW_DOWN"
                            />
                        )}
                    </Header>
                </HeaderWrapper>
            )}
            <AnimationWrapper opened={isOpened} onUpdate={props.onUpdate}>
                {props.children}
            </AnimationWrapper>
        </Wrapper>
    );
});
