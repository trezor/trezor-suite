import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import { FixedSizeList, ListProps } from 'react-window';

const StyledList = styled(FixedSizeList)<ListProps>`
    padding: 0;
    box-shadow: 'none';
    /* background: colors.WHITE; */
    border-left: 1px solid ${colors.DIVIDER};
    border-right: 1px solid ${colors.DIVIDER};
    border-bottom: 1px solid ${colors.DIVIDER};
`;

const MenuList = ({ children, options, maxHeight, getValue }: any) => {
    const height = 32;
    const [value] = getValue();
    const initialOffset = options.indexOf(value) * height;

    return (
        <StyledList
            height={maxHeight}
            itemCount={children.length || 0}
            width="100%"
            itemSize={height}
            initialScrollOffset={initialOffset}
        >
            {({ index, style }) => <div style={style}>{children[index]}</div>}
        </StyledList>
    );
};

export default MenuList;
