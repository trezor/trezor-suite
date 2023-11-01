import styled, { keyframes } from 'styled-components';

const StyledLoaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const rotateAnimation = keyframes`
  100% {
    transform: rotate(360deg);
  }
`;

const dashAnimation = keyframes`
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124;
  }
`;

const StyledLoader = styled.div`
    position: relative;
    width: 130px;
    height: 130px;
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: center;
    color: #757575;

    @media screen and (min-width: 768px) {
        width: 160px;
        height: 160px;
    }
`;

const Circular = styled.div`
    padding-top: 0;
    width: 100%;
    height: 100%;
    animation: ${rotateAnimation} 2s linear infinite;
    animation-delay: 200ms;
    transition-delay: 200ms;
    transform-origin: center center;
    position: absolute;
`;

const Route = styled.circle`
    stroke: #f2f2f2;
`;

const Path = styled.circle`
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
    animation:
        ${dashAnimation} 1.5s ease-in-out infinite,
        color 6s ease-in-out infinite;
    animation-delay: 200ms;
    transition-delay: 200ms;
    stroke-linecap: round;

    @keyframes color {
        100%,
        0% {
            stroke: #01b757;
        }

        40% {
            stroke: #01b757;
        }

        66% {
            stroke: #00ab51;
        }

        80%,
        90% {
            stroke: #009546;
        }
    }
`;

const Message = styled.div`
    color: #757575;
    size: 9px;
`;

interface LoaderProps {
    message?: string;
}
export const Loader = ({ message }: LoaderProps) => (
    <StyledLoaderWrapper data-test="@connect-ui/loader">
        <StyledLoader>
            <Circular>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="25 25 50 50"
                    preserveAspectRatio="xMidYMid"
                >
                    <Route
                        cx="50"
                        cy="50"
                        r="20"
                        fill="none"
                        stroke=""
                        strokeWidth="1"
                        strokeMiterlimit="10"
                    />
                    <Path
                        cx="50"
                        cy="50"
                        r="20"
                        fill="none"
                        strokeWidth="1"
                        strokeMiterlimit="10"
                    />
                </svg>
            </Circular>
        </StyledLoader>
        <div>
            <Message>{message}</Message>
        </div>
    </StyledLoaderWrapper>
);
