import React, { useState, forwardRef, useRef } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors, Icon } from '@trezor/components';
import { Account } from '@wallet-types';
import AnimationWrapper from '../AnimationWrapper';

const Wrapper = styled.div`
    padding: 0px 10px;
`;

const HeaderWrapper = styled.div`
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 0px 10px;
    margin: 10px 0px;
    background: ${colors.WHITE};
`;

const Header = styled.header`
    display: flex;
    padding: 10px 0px;
    cursor: pointer;
    justify-content: space-between;
    align-items: center;

    text-transform: uppercase;
    font-size: 12px;
    font-weight: 600;
    color: ${colors.BLACK50};
    border-bottom: 2px solid ${colors.BLACK96};
`;

interface Props {
    type: Account['accountType'];
    animate?: boolean;
    opened?: boolean;
    children?: React.ReactNode;
    onAnimationStart?: () => void;
    onUpdate?: () => void;
    onAnimationComplete?: () => void;
}

export default forwardRef((props: Props, _ref: React.Ref<HTMLDivElement>) => {
    const hasHeader = props.type !== 'normal';
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(!!props.opened || !hasHeader);
    const isOpened = expanded || props.opened || !hasHeader;
    const [animatedIcon, setAnimatedIcon] = useState(false); // TODO: move animation to framer
    // React.useEffect(() => {
    //     console.log('====>FIRST TIME, MOVE ME UP');
    // }, [animatedIcon]);

    if (!props.children || React.Children.count(props.children) === 0) return null;

    const onClick = () => {
        if (props.opened) return;
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
                    <Header onClick={onClick}>
                        <Translation
                            id={
                                props.type === 'legacy'
                                    ? 'TR_LEGACY_ACCOUNTS'
                                    : 'TR_SEGWIT_ACCOUNTS'
                            }
                        />
                        <Icon
                            canAnimate={animatedIcon}
                            isActive={isOpened}
                            size={12}
                            color={colors.BLACK50}
                            icon="ARROW_DOWN"
                        />
                    </Header>
                </HeaderWrapper>
            )}
            <AnimationWrapper opened={isOpened} onUpdate={props.onUpdate}>
                {props.children}
            </AnimationWrapper>
        </Wrapper>
    );
});
