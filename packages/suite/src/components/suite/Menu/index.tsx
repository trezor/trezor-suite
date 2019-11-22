import React from 'react';
import { Props } from './Container';
import styled from 'styled-components';
import Item from './components/Item';

const Wrapper = styled.div`
    background: #2b2b2b; /* TODO: fetch from components */
    width: 120px;
    display: flex;
    flex-direction: column;
    padding-top: 100px;
`;

const Menu = (props: Props) => {
    return (
        <Wrapper>
            {[
                { text: 'Dashboard', icon: '', route: '/dashboard' },
                { text: 'Wallet', icon: '', route: '/wallet' },
                { text: 'Passwords', icon: '', route: '/passwords' },
                { text: 'Exchange', icon: '', route: '/exchange' },
            ].map(item => (
                // @ts-ignore TODO add routes
                <Item
                    goto={props.goto}
                    isActive={`/${props.router.app}` === item.route}
                    key={item.text}
                    icon={item.icon}
                    route={item.route}
                    text={item.text}
                />
            ))}
        </Wrapper>
    );
};

export default Menu;
