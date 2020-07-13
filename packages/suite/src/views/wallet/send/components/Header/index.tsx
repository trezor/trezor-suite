import React from 'react';
import styled from 'styled-components';
import { variables, colors, Dropdown } from '@trezor/components';
import Clear from './components/Clear';

const Wrapper = styled.div`
    display: flex;
    padding: 6px 12px;
`;

const HeaderLeft = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
`;

export default () => (
    <Wrapper>
        <HeaderLeft />
        <HeaderRight>
            <Clear />
            <Dropdown
                alignMenu="right"
                items={[
                    {
                        options: [
                            {
                                callback: () => {},
                                label: 'aaa',
                                isHidden: false,
                            },
                        ],
                    },
                ]}
            />
        </HeaderRight>
    </Wrapper>
);
