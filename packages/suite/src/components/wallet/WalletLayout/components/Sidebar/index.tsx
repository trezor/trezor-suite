import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Backdrop from '@suite-components/Backdrop';
import { toggleSidebar } from '@suite-actions/suiteActions';
import { variables, colors } from '@trezor/components';
import { bindActionCreators } from 'redux';
import Menu from '@wallet-components/Menu';
import { AppState } from '@suite-types';

const { SCREEN_SIZE } = variables;

interface Props {
    router: AppState['router'];
    suite: AppState['suite'];
    isOpen?: boolean;
    toggleSidebar: typeof toggleSidebar;
}

type WrapperProps = Pick<Props, 'isOpen'>;

const AbsoluteWrapper = styled.aside<WrapperProps>`
    width: 240px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
    background: ${colors.WHITE};
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
