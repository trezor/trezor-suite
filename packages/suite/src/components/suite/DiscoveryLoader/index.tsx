import React from 'react';
import styled from 'styled-components';
import Loading from '@suite-components/Loading';
import ModalWrapper from '@suite-components/ModalWrapper';
import { variables, colors } from '@trezor/components-v2';

const Wrapper = styled(ModalWrapper)`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 360px;
`;

const Title = styled.div`
    max-width: 80%;
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
    color: ${colors.BLACK0};
    margin-bottom: 10px;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
    color: ${colors.BLACK50};
    margin-bottom: 4px;
`;

const Expand = styled.div`
    display: flex;
    /* flex: 1; */
    margin: 40px 0px;
`;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const DiscoveryLoader = (props: Props) => {
    return (
        <Wrapper {...props}>
            <Title>Coin discovery in progress…</Title>
            <Description>
                To find your accounts and funds we need to perform a coin discovery which will
                discover all your coins.
            </Description>
            <Expand>
                <Loading padding="0px" />
            </Expand>
        </Wrapper>
    );
};

export default DiscoveryLoader;
