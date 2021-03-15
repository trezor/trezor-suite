import React from 'react';
import styled from 'styled-components';
import { BoxImage, BoxImageProps } from './BoxImage';

type BoxPaddingProps = 'normal' | 'large';

const BoxWrapper = styled.div<{ padding?: BoxPaddingProps; boxImage?: boolean }>`
    position: relative;
    padding: 20px 30px;
    border-radius: 16px;
    box-shadow: 0 2px 5px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    background: ${props => props.theme.BG_WHITE};

    ${props => props.padding && props.padding === 'large' && `padding: 40px 80px;`}
    ${props => props.boxImage && `padding-top: 80px;`}
`;

const BoxImageWrapper = styled.div`
    width: 100px;
    height: 100px;
    position: absolute;
    z-index: 1;
    margin-left: auto;
    margin-right: auto;
    top: -50px;
    left: 0;
    right: 0;
`;

const ChildrenWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

interface Props {
    padding?: BoxPaddingProps;
    boxImage?: BoxImageProps;
    children: React.ReactNode;
}

const Box = ({ padding = undefined, boxImage = undefined, children }: Props) => {
    return (
        <BoxWrapper padding={padding} boxImage={!!boxImage}>
            {boxImage && (
                <BoxImageWrapper>
                    <BoxImage image={boxImage} />
                </BoxImageWrapper>
            )}
            <ChildrenWrapper>{children}</ChildrenWrapper>
        </BoxWrapper>
    );
};

export { Box };
