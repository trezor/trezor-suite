import colors from 'config/colors';
import styled from 'styled-components';

const ButtonPin = styled.button`
    width: 80px;
    height: 80px;
    border: 1px solid ${colors.DIVIDER};
    background: ${colors.WHITE};
    transition: all 0.3s;
    position: relative;
    cursor: pointer;

    &:first-child {
        margin-left: 0px;
    }

    &:hover {
        color: ${colors.TEXT_PRIMARY};
        background-color: ${colors.WHITE};
        border-color: ${colors.TEXT_SECONDARY};
    }

    &:active {
        color: ${colors.TEXT_PRIMARY};
        background: ${colors.DIVIDER};
        border-color: ${colors.DIVIDER};
    }

    &:before {
        width: 6px;
        height: 6px;
        content: ' ';
        position: absolute;
        border-radius: 100%;
        background: ${colors.TEXT_PRIMARY};
        top: calc(50% - 3px);
        left: calc(50% - 3px);
    }
`;

export default ButtonPin;