import styled from 'styled-components';
import * as BREAKPOINTS from '@suite/config/onboarding/breakpoints';

const ControlsWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin-top: 10px;
    margin-bottom: 10px;
    & > * {
        margin: 3px 10px 3px 10px;
    }

    width: 100%;

    @media (max-width: ${BREAKPOINTS.SM}px) {
        flex-direction: column;
        & > * {
            margin: 3px 0 3px 0;
        }
    }
`;

export default ControlsWrapper;
