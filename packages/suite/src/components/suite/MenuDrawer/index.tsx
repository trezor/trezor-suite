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

const Wrapper = styled(motion.div)<{ wide?: boolean }>`
    position: relative;
    width: ${props => (props.wide ? '374px' : '254px')};
    flex-direction: ${props => (props.wide ? 'initial' : 'column')};
    height: 100%;
    background: ${colors.WHITE};
    overflow: hidden;
    box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.1);
    z-index: 2;
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

const AnimatedWrapper = ({ children, wide }: WrapperProps) => {
    const visible = { x: 0 };
    const hidden = { x: '-100%' };
    const trans = { duration: 0.24, ease: [0.04, 0.62, 0.23, 0.98] };
    return (
        <Wrapper wide={wide} initial={hidden} animate={visible} exit={hidden} transition={trans}>
            {children}
        </Wrapper>
    );
};

const MenuDrawer = ({ children, router, layoutSize, modalContext }: Props) => {
    const [url, setUrl] = useState(router.url);
    const [opened, setOpened] = useState(false);
    const [topLevel, setTopLevel] = useState(false);
    const displayPrimary = !children || topLevel;
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

    // TODO: listen for account change
    return (
        <>
            <Header onClick={() => setOpened(!opened)} />
            <AnimatePresence initial={false}>
                {opened && (
                    <Container>
                        <Overlay onClick={() => setOpened(false)} />
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
                                {children}
                            </AnimatedWrapper>
                        )}
                        {displayPrimary && (
                            <AnimatedWrapper key="primary">
                                <Menu
                                    fullWidth
                                    openSecondaryMenu={() =>
                                        children ? setTopLevel(false) : setOpened(false)
                                    }
                                />
                            </AnimatedWrapper>
                        )}
                    </Container>
                )}
            </AnimatePresence>
        </>
    );
};

export default connect(mapStateToProps)(MenuDrawer);
