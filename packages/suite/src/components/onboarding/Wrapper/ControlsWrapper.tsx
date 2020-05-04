import styled from 'styled-components';
import { variables } from '@trezor/components';

interface Props {
    isVertical?: boolean;
}

const ControlsWrapper = styled.div<Props>`
    display: flex;
    flex-direction: ${({ isVertical }) => (isVertical ? 'column' : 'row')};
    min-width: ${({ isVertical }) => (isVertical ? '240px' : '100%')};

    justify-content: ${({ isVertical }) => (isVertical ? 'center' : 'space-around')};
    margin-top: 8px;
    margin-bottom: 8px;
    & > * {
        margin: 4px 8px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        & > * {
            margin: 4px 0;
        }
    }
`;

export default ControlsWrapper;
