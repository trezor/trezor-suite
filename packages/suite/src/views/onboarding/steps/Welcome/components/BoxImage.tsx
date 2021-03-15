import React from 'react';
import styled from 'styled-components';

export type BoxImageProps = 'lock';

const BoxImageWrapper = styled.div`
    width: 100px;
    height: 100px;
`;

interface Props {
    image: BoxImageProps;
}

const BoxImage = ({ image = 'lock' }: Props) => {
    return (
        <BoxImageWrapper>
            {image === 'lock' && (
                <img src="https://dummyimage.com/100x100&text=lock+image+dummy" alt="" />
            )}
        </BoxImageWrapper>
    );
};

export { BoxImage };
