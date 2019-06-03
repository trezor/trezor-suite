import React from 'react';
import styled from 'styled-components';

import colors from '@suite/config/onboarding/colors';

const ListItem = styled.li`
    text-align: justify;

    &:before {
        content: '●';
        padding-right: 7px;
        color: ${colors.grayDark};
    }
    & > * {
        display: inline;
    }
`;

const UnorderedListWrapper = styled.ul`
    list-style: none;
`;

interface Item {
    key: string;
    component: React.ReactNode;
}

interface Props {
    items: Item[];
}

const UnorderedList = ({ items }: Props) => (
    <UnorderedListWrapper>
        {items.map((item: Item) => (
            <ListItem key={item.key}>{item.component}</ListItem>
        ))}
    </UnorderedListWrapper>
);

export default UnorderedList;
