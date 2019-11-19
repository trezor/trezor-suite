import React from 'react';
import styled from 'styled-components';
import Item from './components/Item';

const Wrapper = styled.div`
    background: #2b2b2b;
    width: 120px;
    display: flex;
    flex-direction: column;
    padding-top: 100px;
`;

const Menu = () => {
    return (
        <Wrapper>
            {[
                { text: 'Dashboard', icon: '', link: '/dashboard' },
                { text: 'Wallet', icon: '', link: '/wallet' },
                { text: 'Passwords', icon: '', link: '/passwords' },
                { text: 'Exchange', icon: '', link: '/exchange' },
            ].map(item => (
                <Item icon={item.icon} link={item.link} text={item.text} />
            ))}
        </Wrapper>
    );
};

export default Menu;
