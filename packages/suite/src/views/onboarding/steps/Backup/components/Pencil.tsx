import React, { CSSProperties } from 'react';
import styled, { keyframes, css } from 'styled-components';

import colors from '@suite/config/onboarding/colors';

const shake = keyframes`
    0%{transform:rotateZ(0);}
    20%{transform:rotateZ(25deg);}
    30%{transform:rotateZ(15deg);}
    40%{transform:rotateZ(25deg);}
    50%{transform:rotateZ(15deg);}
    60%{transform:rotateZ(25deg);}
    80%{transform:rotateZ(15deg);}
    100%{transform:rotateZ(0);}
`;

interface Props {
    style: CSSProperties;
    animate: boolean;
}

const Wrapper = styled.div<Props>`
    height: 20px;
    width: 4px;
    transform: rotateZ(25deg);
    ${props =>
        props.animate
            ? css`
                  animation: ${shake} 3s infinite;
              `
            : null}
    ${props => ({ ...props.style })}
`;

const Eraser = styled.div`
    height: 10%;
    width: 100%;
    background-color: #979602;
    border-top-left-radius: 10%;
    border-top-right-radius: 10%;
`;

const Body = styled.div`
    height: 90%;
    width: 100%;
    background-color: ${colors.black};
`;

const Top = styled.div`
    width: 0px;
    height: 0px;
    border-top: 5px solid #000000;
    border-left: 2px solid transparent;
    border-right: 2px solid transparent;
    margin: 0px auto;
`;

const Pencil = ({ style, animate }: Props) => (
    <Wrapper style={style} animate={animate}>
        <Eraser />
        <Body />
        <Top />
    </Wrapper>
);

export default Pencil;
