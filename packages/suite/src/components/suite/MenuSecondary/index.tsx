import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import Backdrop from '@suite-components/Backdrop';
import { toggleSidebar } from '@suite-actions/suiteActions';
import { variables, colors } from '@trezor/components';
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
