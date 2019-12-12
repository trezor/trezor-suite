import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import Backdrop from '@suite-components/Backdrop';
import { toggleSidebar } from '@suite-actions/suiteActions';
import { variables } from '@trezor/components';
import { colors } from '@trezor/components-v2';

import { AppState } from '@suite-types';

const { SCREEN_SIZE } = variables;

interface Props {
    router: AppState['router'];
    suite: AppState['suite'];
    isOpen?: boolean;
    toggleSidebar: typeof toggleSidebar;
    children: React.ReactNode;
}

type WrapperProps = Pick<Props, 'isOpen'>;

const AbsoluteWrapper = styled.aside<WrapperProps>`
    width: 240px;
    background: ${colors.WHITE};
    box-shadow: 2px 0px 3px rgb(0, 0, 0, 0.1);
    margin-right: 3px;
    height: 100%;
    overflow-y: auto;

    /* TODO: this make nice scrollbar on webkit-like browsers however it prevents hiding the scrollbar on macs (should hide when there is no mouse connected) */
    /* Maybe we should just use something like https://github.com/Grsmto/simplebar */
    ::-webkit-scrollbar {
        background-color: #fff;
        width: 10px;
    }

    /* background of the scrollbar except button or resizer */
    ::-webkit-scrollbar-track {
        background-color: transparent;
    }

    /* scrollbar itself */
    ::-webkit-scrollbar-thumb {
        /* 7F7F7F for mac-like color */
        background-color: #babac0;
        border-radius: 10px;
        border: 2px solid #fff;
    }

    /* set button(top and bottom of the scrollbar) */
    ::-webkit-scrollbar-button {
        display: none;
    }
`;

const Wrapper = styled.div`
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

const MenuSecondary = ({ isOpen, toggleSidebar, children }: Props) => {
    return (
        <>
            <StyledBackdrop show={isOpen} onClick={toggleSidebar} animated />
            <AbsoluteWrapper isOpen={isOpen}>
                <Wrapper>{children}</Wrapper>
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
}))(MenuSecondary);
