import styled from 'styled-components';

interface Props {
    desktopBorder?: string;
    guidePanelSize?: string;
}

const ModalOverlay = styled.div<Props>`
    position: fixed;
    z-index: 10000;
    width: ${props =>
        props.desktopBorder
            ? `calc(100% - (${props.desktopBorder} * 2) - ${props.guidePanelSize ?? '0px'})`
            : `calc(100% - ${props.guidePanelSize ?? '0px'})`};
    height: ${props => (props.desktopBorder ? `calc(100% - ${props.desktopBorder})` : '100%')};
    top: 0px;
    left: ${props => props.desktopBorder || 0};
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    justify-content: center;
`;

export { ModalOverlay, Props as ModalOverlayProps };
