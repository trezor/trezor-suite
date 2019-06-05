import * as React from 'react';
import styled from 'styled-components';
import { colors, variables, animations } from '@trezor/components';

const AbsoluteWrapper = styled.aside`
    width: 320px;
    position: relative;
    overflow-y: ${props => (props.deviceMenuOpened ? 'hidden' : 'auto')};

    background: ${colors.MAIN};
    border-top-left-radius: 4px;
    border-right: 1px solid ${colors.DIVIDER};

    overflow-x: hidden;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        position: absolute;
        z-index: 200;
        top: 52px;
        /* Prevents firing SLIDE_LEFT anim on page load.  */
        /* isOpen is null until user clicks on menu toggler */
        display: ${props => (props.isOpen === null ? 'none' : 'block')};
        animation: ${props => (props.isOpen ? variables.SLIDE_RIGHT : variables.SLIDE_LEFT)} 0.25s
            cubic-bezier(0.17, 0.04, 0.03, 0.94) forwards;
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        border-top-left-radius: 0px;
    }
`;

const SidebarWrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        height: calc(100vh - 52px);
    }
`;

export default class Sidebar extends React.PureComponent<Props, State> {
    render() {
        return (
            <AbsoluteWrapper
                isOpen={this.props.isOpen}
                deviceMenuOpened={this.props.deviceMenuOpened}
            >
                <SidebarWrapper>{this.props.children}</SidebarWrapper>
            </AbsoluteWrapper>
        );
    }
}
