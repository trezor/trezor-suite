import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import CoinMenu from '@wallet-components/CoinMenu';
import Backdrop from '@suite-components/Backdrop';
import { toggleSidebar } from '@suite-actions/suiteActions';
import { variables, animations, colors } from '@trezor/components';
import { bindActionCreators } from 'redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import AccountMenu from '@suite/components/wallet/AccountMenu';
import { AppState } from '@suite-types';

const { SCREEN_SIZE } = variables;
const { SLIDE_RIGHT, SLIDE_LEFT } = animations;

interface Props {
    router: AppState['router'];
    suite: AppState['suite'];
    isOpen?: boolean;
    toggleSidebar: typeof toggleSidebar;
}

type WrapperProps = Pick<Props, 'isOpen'>;
const AbsoluteWrapper = styled.aside<WrapperProps>`
    width: 320px;
    position: relative;
    overflow-y: auto;

    background: ${colors.MAIN};
    border-top-left-radius: 4px;
    border-right: 1px solid ${colors.DIVIDER};

    overflow-x: hidden;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        position: absolute;
        z-index: 200;
        top: 52px;
        /* Prevents firing SLIDE_LEFT anim on page load.  */
        /* isOpen is null until user clicks on menu toggler */
        display: ${props => (props.isOpen === undefined ? 'none' : 'block')};
        animation: ${props => (props.isOpen ? SLIDE_RIGHT : SLIDE_LEFT)} 0.25s
            cubic-bezier(0.17, 0.04, 0.03, 0.94) forwards;
    }

    @media screen and (max-width: ${SCREEN_SIZE.LG}) {
        border-top-left-radius: 0px;
    }
`;

const SidebarWrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        height: calc(100vh - 52px);
    }
`;

const StyledBackdrop = styled(Backdrop)`
    display: none;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        display: initial;
    }
`;

const TransitionGroupWrapper = styled(TransitionGroup)`
    width: 640px;
`;

const TransitionContentWrapper = styled.div`
    width: 320px;
    display: inline-block;
    vertical-align: top;
`;
interface TransitionMenuProps {
    animationType?: string;
    children?: React.ReactNode;
}

// TransitionMenu needs to dispatch window.resize event
// in order to StickyContainer be recalculated
const TransitionMenu = (props: TransitionMenuProps) => (
    <TransitionGroupWrapper component="div" className="transition-container">
        <CSSTransition
            key={props.animationType}
            onExit={() => {
                window.dispatchEvent(new Event('resize'));
            }}
            onExited={() => window.dispatchEvent(new Event('resize'))}
            in
            out
            classNames={props.animationType}
            appear={false}
            timeout={300}
        >
            <TransitionContentWrapper>{props.children}</TransitionContentWrapper>
        </CSSTransition>
    </TransitionGroupWrapper>
);

const Sidebar = ({ isOpen, toggleSidebar, router }: Props) => {
    const shouldRenderAccounts = !!router.params.coin;

    const menu = (
        <TransitionMenu animationType={shouldRenderAccounts ? 'slide-left' : 'slide-right'}>
            {shouldRenderAccounts ? <AccountMenu /> : <CoinMenu />}
        </TransitionMenu>
    );

    return (
        <>
            <StyledBackdrop show={isOpen} onClick={toggleSidebar} animated />
            <AbsoluteWrapper isOpen={isOpen}>
                <SidebarWrapper>{menu}</SidebarWrapper>
            </AbsoluteWrapper>
        </>
    );
};

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        toggleSidebar: bindActionCreators(toggleSidebar, dispatch),
    }),
)(Sidebar);
