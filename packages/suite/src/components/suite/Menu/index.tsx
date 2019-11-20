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
                { text: 'Dashboard', icon: '', link: '/dashboard' },
                { text: 'Wallet', icon: '', link: '/wallet' },
                { text: 'Passwords', icon: '', link: '/passwords' },
                { text: 'Exchange', icon: '', link: '/exchange' },
            ].map(item => (
                <Item
                    isActive={`/${props.router.app}` === item.link}
                    key={item.text}
                    icon={item.icon}
                    link={item.link}
                    text={item.text}
                />
            ))}
        </Wrapper>
    );
};

export default Menu;
