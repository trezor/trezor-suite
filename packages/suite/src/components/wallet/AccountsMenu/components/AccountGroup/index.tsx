import React, { useState, forwardRef, useRef } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors, Icon } from '@trezor/components';
import { Account } from '@wallet-types';
import AnimationWrapper from '../AnimationWrapper';

const Wrapper = styled.div``;

const HeaderWrapper = styled.div`
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${colors.WHITE};
`;

const Header = styled.header<{ onClick?: () => void }>`
    display: flex;
    padding: 16px;
    cursor: ${props => (props.onClick ? 'pointer' : 'default')};
    justify-content: space-between;
    align-items: center;

    text-transform: uppercase;
    font-size: 12px;
    font-weight: 600;
    color: ${colors.BLACK50};
    border-top: 2px solid ${colors.BLACK96};
`;

interface Props {
    type: Account['accountType'];
    animate?: boolean;
    keepOpened: boolean;
    hasBalance: boolean;
    children?: React.ReactNode;
    onAnimationStart?: () => void;
    onUpdate?: () => void;
    onAnimationComplete?: () => void;
}

export default forwardRef((props: Props, _ref: React.Ref<HTMLDivElement>) => {
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
                    <Header onClick={!props.keepOpened ? onClick : undefined}>
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
                                color={colors.BLACK50}
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
