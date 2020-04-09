import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import Menu from '@suite-components/Menu/Container';
import { AppState } from '@suite-types';

import Header from './components/Header';
import Overlay from './components/Overlay';
import AppsButton from './components/AppsButton';

const Container = styled.div`
    position: fixed;
    z-index: 10000;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
`;

const Wrapper = styled(motion.div)`
    position: absolute;
    z-index: 2;
    height: 100%;
`;

const LevelWrapper = styled(motion.div)<{ wide?: boolean }>`
    width: ${props => (props.wide ? '374px' : '254px')};
    flex-direction: ${props => (props.wide ? 'initial' : 'column')};
    height: 100%;
    background: ${colors.WHITE};
    overflow: hidden;
    box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.1);
    display: flex;
`;

const mapStateToProps = (state: AppState) => ({
    modalContext: state.modal.context,
    layoutSize: state.resize.size,
    router: state.router,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children: React.ReactNode;
};

interface WrapperProps {
    children: React.ReactNode;
    wide?: boolean;
}

const hidden = { position: 'absolute', x: '-100%' } as const;
const transition = { duration: 0.33 };

const AnimatedWrapper = ({ children, wide }: WrapperProps) => {
    const visible = { x: 0, transitionEnd: { position: 'relative' } } as const;
    return (
        <LevelWrapper
            wide={wide}
            initial={hidden}
            animate={visible}
            exit={hidden}
            transition={transition}
        >
            {children}
        </LevelWrapper>
    );
};

const MenuDrawer = ({ children, router, layoutSize, modalContext }: Props) => {
    const [secondaryMenu, setSecondaryMenu] = useState(children);
    const [url, setUrl] = useState(router.url);
    const [opened, setOpened] = useState(false);
    const [topLevel, setTopLevel] = useState(false);
    const displayPrimary = !secondaryMenu || topLevel;
    const displayBothLevels = layoutSize === 'SMALL';

    // reset "topLevel" flag
    useEffect(() => {
        if (!opened && topLevel) {
            setTopLevel(false);
        }
    }, [opened, topLevel]);

    // handle router url change
    useEffect(() => {
        if (router.url !== url) {
            setOpened(false);
            setUrl(router.url);
        }
    }, [router.url, url]);

    // handle modal opened
    useEffect(() => {
        if (modalContext !== '@modal/context-none') {
            setOpened(false);
        }
    }, [modalContext]);

    // handle children changes
    // children needs to be memorized otherwise there will be visible re-render durning "close" animation
    React.useMemo(() => {
        if (!opened) setSecondaryMenu(children);
    }, [children, opened]);

    // first AnimatePresence is for opening drawer
    // second AnimatePresence is for switching between levels

    return (
        <>
            <Header onClick={() => setOpened(!opened)} />
            <AnimatePresence>
                {opened && (
                    <Container>
                        <Overlay onClick={() => setOpened(false)} />
                        <Wrapper
                            initial={hidden}
                            animate={{ x: 0 }}
                            exit={hidden}
                            transition={transition}
                        >
                            <AnimatePresence initial={false}>
                                {!displayPrimary && (
                                    <AnimatedWrapper key="secondary" wide={displayBothLevels}>
                                        {displayBothLevels && (
                                            <Menu
                                                openSecondaryMenu={() => {
                                                    setOpened(false);
                                                }}
                                            />
                                        )}
                                        {!displayBothLevels && (
                                            <AppsButton onClick={() => setTopLevel(!topLevel)} />
                                        )}
                                        {secondaryMenu}
                                    </AnimatedWrapper>
                                )}
                                {displayPrimary && (
                                    <AnimatedWrapper key="primary">
                                        <Menu
                                            fullWidth
                                            openSecondaryMenu={() =>
                                                secondaryMenu
                                                    ? setTopLevel(false)
                                                    : setOpened(false)
                                            }
                                        />
                                    </AnimatedWrapper>
                                )}
                            </AnimatePresence>
                        </Wrapper>
                    </Container>
                )}
            </AnimatePresence>
        </>
    );
};

export default connect(mapStateToProps)(MenuDrawer);
