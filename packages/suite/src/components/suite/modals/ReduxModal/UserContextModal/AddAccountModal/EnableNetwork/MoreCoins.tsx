import { useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled, { useTheme } from 'styled-components';
import { Icon, P } from '@trezor/components';
import { Translation } from 'src/components/suite';

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
            width: 0,
        },
        visible: {
            opacity: 1,
            width: 'auto',
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
    margin-top: 8px;
    min-width: ${({ isExpanded }) => (isExpanded ? '100%' : 0)};

    :hover {
        opacity: ${({ isExpanded }) => !isExpanded && 0.7};
    }
`;

const ContentWrapper = styled.div`
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
    cursor: ${({ isExpanded }) => !isExpanded && 'pointer'};
`;

const HeaderWrapper = styled.div`
    position: relative;
    display: flex;
`;

interface Props {
    children: ReactNode;
}

const PlusIconWrapper = ({ children }: Props) => (
    <motion.div {...triggerAnimation}>{children}</motion.div>
);

const StyledIcon = styled(Icon)`
    padding-right: 15px;
`;

const Label = styled(({ isExpanded, children }: { isExpanded: boolean; children: ReactNode }) => (
    <P type={isExpanded ? 'callout' : 'body'}>{children}</P>
))`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    transition: all ${animationDuration}s ease-in-out;
`;

const Header = ({
    isExpanded,
    setExpanded,
}: {
    isExpanded: boolean;
    setExpanded: Dispatch<SetStateAction<boolean>>;
}) => {
    const theme = useTheme();
    return (
        <HeaderWrapper>
            <OpenIconWrapper
                data-test="@modal/account/activate_more_coins"
                isExpanded={isExpanded}
                onClick={() => {
                    setExpanded(true);
                }}
            >
                <AnimatePresence initial={false}>
                    {!isExpanded && (
                        <PlusIconWrapper>
                            <StyledIcon icon="PLUS" size={20} color={theme.TYPE_DARK_GREY} />
                        </PlusIconWrapper>
                    )}
                </AnimatePresence>
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

const Content = ({ children }: Props) => (
    <motion.div {...contentAnimation}>
        <ContentWrapper>{children}</ContentWrapper>
    </motion.div>
);

export const MoreCoins = ({ children }: Props) => {
    const [isExpanded, setExpanded] = useState(false);
    return (
        <BackgroundWrapper isExpanded={isExpanded}>
            <Header setExpanded={setExpanded} isExpanded={isExpanded} />
            <AnimatePresence>{isExpanded && <Content>{children}</Content>}</AnimatePresence>
        </BackgroundWrapper>
    );
};
