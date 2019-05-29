import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors } from 'trezor-ui-components';
import { FixedSizeList } from 'react-window';

const StyledList = styled(FixedSizeList)`
    padding: 0;
    box-shadow: 'none';
    background: colors.WHITE;
    border-left: 1px solid ${colors.DIVIDER};
    border-right: 1px solid ${colors.DIVIDER};
    border-bottom: 1px solid ${colors.DIVIDER};
`;

const MenuList = ({ children, options, maxHeight, getValue }) => {
    const height = 32;
    const [value] = getValue();
    const initialOffset = options.indexOf(value) * height;

    return (
        <StyledList
            height={maxHeight}
            itemCount={children.length}
            itemSize={height}
            initialScrollOffset={initialOffset}
        >
            {({ index, style }) => <div style={style}>{children[index]}</div>}
        </StyledList>
    );
};

MenuList.propTypes = {
    children: PropTypes.node,
    options: PropTypes.array,
    maxHeight: PropTypes.number,
    getValue: PropTypes.func,
};

export default MenuList;
