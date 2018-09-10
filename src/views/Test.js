import * as React from 'react';
import styled from 'styled-components';
import Sticky from 'react-sticky-el';

import DeviceHeader from 'components/DeviceHeader';

const App = styled.div`
    border: 2px dashed lime;
    width: 100vh;
    padding: 150px;
    height: 1800px;
`;

const Wrapper = styled(Sticky)`
    max-width: 400px;
    padding: 20px;
    height: 100vh;
    display: flex;
    border: 2px dashed blue;
    flex-direction: column;
`;

const Content = styled.div`
    flex: 1;
    overflow: auto;
    height: 100%;
    border: 2px solid gold;
`;

const Header = styled(Sticky)`
    flex-shrink: 0;
    border: 2px solid red;
    background: white;
`;

const Footer = styled(Sticky)`
    border: 2px solid tan;
`;

const Item = styled.div`
    width: 100%;
    height: 35px;
    border: 1px solid navy;
    padding: 5px;
    margin: 10px 0;
`;

const T = () => (
    <App>
        <Wrapper>
            <Header>
                <DeviceHeader device={{ connected: true }} devices={[1, 2]} />
            </Header>
            <Content>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>
                <Item>aaa</Item>

            </Content>
            <Footer mode="bottom">footer</Footer>
        </Wrapper>
    </App>
);

export default T;
