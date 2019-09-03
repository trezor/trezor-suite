import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

interface Props {
    progress: number;
    isHidden: boolean;
}

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
`;

const Line = styled.div<Props>`
    height: 1px;
    display: flex;
    background: ${props => (!props.isHidden ? colors.GREEN_PRIMARY : colors.GRAY_LIGHT)};
    width: ${props => props.progress}%;
`;

const ProgressBar = (props: Props) => {
    const [isHidden, setHide] = useState(false);

    useEffect(() => {
        if (props.progress === 100) {
            setTimeout(() => {
                setHide(true);
            }, 2000);
        }
    });

    return (
        <Wrapper>
            <Line isHidden={isHidden} progress={props.progress} />
        </Wrapper>
    );
};

export default ProgressBar;
