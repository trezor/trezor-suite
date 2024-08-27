import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';

import { Icon, IconName, variables } from '@trezor/components';

const Items = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    margin: 24px 0;
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
`;

const Text = styled.div`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Item {
    icon: IconName;
    content: ReactNode;
}

interface SecurityChecklistProps {
    items: readonly Item[];
}

export const SecurityChecklist = ({ items }: SecurityChecklistProps) => {
    const theme = useTheme();

    return (
        <Items>
            {items.map(item => (
                <Item key={item.icon}>
                    <Icon size={24} name={item.icon} color={theme.legacy.TYPE_DARK_GREY} />
                    <Text>{item.content}</Text>
                </Item>
            ))}
        </Items>
    );
};
