import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border: 2px solid ${colors.BLACK96};
    border-radius: 5px;
`;

const Row = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
`;

const Column = styled.div`
    flex: 1;
    padding: 30px;
    min-width: 320px;
`;

const Left = styled(Column)`
    border-right: 2px solid ${colors.BLACK96};
`;

const Right = styled(Column)`
    position: relative;
`;

const Middle = styled.div`
    padding: 30px;
    border-top: 2px solid ${colors.BLACK96};
`;

const Bottom = styled.div`
    padding: 30px;
    border-top: 2px solid ${colors.BLACK96};
`;

interface Props {
    left: ReactElement;
    right: ReactElement | null;
    middle?: ReactElement | null;
    bottom?: ReactElement | null;
}

const Layout = (props: Props) => (
    <Wrapper>
        {console.log('props.bottom', props.bottom)}
        <Row>
            <Left>{props.left}</Left>
            <Right>{props.right || ''}</Right>
        </Row>
        <>
            {props.middle && <Middle>{props.middle}</Middle>}
            {props.bottom && <Bottom>{props.bottom}</Bottom>}
        </>
    </Wrapper>
);

export default Layout;
