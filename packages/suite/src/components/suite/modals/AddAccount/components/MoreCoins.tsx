import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled, { css } from 'styled-components';
import { Icon, P } from '@trezor/components';
import { Translation } from '@suite-components';
import { useTheme } from '@suite-hooks';

const animationDuration = 0.24;

const contentAnimation = {
    variants: {
        initial: {
            overflow: 'hidden',
            opacity: 0,
            height: 0,
            width: 0,
        },
        visible: {
            opacity: 1,
            height: 'auto',
            width: 'auto',
            transitionEnd: { overflow: 'unset' }, // overflow needs to be unset after animation
        },
    },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
    transition: { duration: animationDuration, ease: 'easeInOut' },
};

const triggerAnimation = {
    variants: {
        initial: {
            opacity: 0,
        },
        visible: {
            opacity: 1,
        },
    },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
    transition: { duration: animationDuration / 2, ease: 'easeOut' },
};

const BackgroundWrapper = styled.div<{ isExpanded: boolean }>`
    background-color: ${({ theme }) => theme.BG_GREY};
    border-radius: ${({ isExpanded }) => (isExpanded ? 10 : 57)}px;
    transition: all ${animationDuration}s ease-in-out;
    padding: ${({ isExpanded }) => (isExpanded ? '16px' : '10px 16px')};
    margin-right: auto;
`;

const Content = styled(motion.div).attrs(() => ({ ...contentAnimation }))`
    padding-top: 16px;
`;

const CloseIconWrapper = styled(motion.div)`
    padding: 16px;
    margin: -12px;
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
`;

const OpenIconWrapper = styled.div<{ isExpanded: boolean }>`
    display: flex;
    flex-direction: row;
    cursor: pointer;
    ${({ isExpanded }) =>
        isExpanded
            ? css`
                  border-bottom: 1.5px dashed rgba(0, 0, 0, 0.15);
              `
            : ''}
`;

const HeaderWrapper = styled.div`
    position: relative;
    display: flex;
`;

const Label = styled(
    ({ isExpanded, ...rest }: { isExpanded: boolean; children: React.ReactNode }) => (
        <P
            size={isExpanded ? 'tiny' : 'normal'}
            weight={isExpanded ? 'bold' : 'normal'}
            {...rest}
        />
    ),
)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const StyledIcon = styled(Icon)`
    padding-right: 15px;
`;

const Header = ({
    isExpanded,
    setExpanded,
}: {
    isExpanded: boolean;
    setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const { theme } = useTheme();
    return (
        <HeaderWrapper>
            <OpenIconWrapper
                isExpanded={isExpanded}
                onClick={() => {
                    setExpanded(true);
                }}
            >
                {!isExpanded && <StyledIcon icon="PLUS" size={24} color={theme.TYPE_DARK_GREY} />}
                <Label isExpanded={isExpanded}>
                    <Translation id="TR_ACTIVATE_COINS" />
                </Label>
            </OpenIconWrapper>
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <CloseIconWrapper
                        {...triggerAnimation}
                        onClick={() => {
                            setExpanded(false);
                        }}
                    >
                        <Icon icon="CROSS" size={12} />
                    </CloseIconWrapper>
                )}
            </AnimatePresence>
        </HeaderWrapper>
    );
};

interface Props {
    children: React.ReactNode;
}

export const MoreCoins = ({ children }: Props) => {
    const [isExpanded, setExpanded] = useState(false);
    return (
        <BackgroundWrapper isExpanded={isExpanded}>
            <Header setExpanded={setExpanded} isExpanded={isExpanded} />
            <AnimatePresence initial={false}>
                {isExpanded && <Content>{children}</Content>}
            </AnimatePresence>
        </BackgroundWrapper>
    );
};
