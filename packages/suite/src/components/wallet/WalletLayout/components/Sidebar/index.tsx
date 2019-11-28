import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Backdrop from '@suite-components/Backdrop';
import { toggleSidebar } from '@suite-actions/suiteActions';
import { variables, animations, colors } from '@trezor/components';
import { bindActionCreators } from 'redux';
import Menu from '@wallet-components/Menu';
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

const Sidebar = ({ isOpen, toggleSidebar }: Props) => {
    return (
        <>
            <StyledBackdrop show={isOpen} onClick={toggleSidebar} animated />
            <AbsoluteWrapper isOpen={isOpen}>
                <SidebarWrapper>
                    <Menu />
                </SidebarWrapper>
            </AbsoluteWrapper>
        </>
    );
};

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
});

export default connect(mapStateToProps, dispatch => ({
    toggleSidebar: bindActionCreators(toggleSidebar, dispatch),
}))(Sidebar);
