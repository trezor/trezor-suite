import React from 'react';
import styled from 'styled-components';
import { variables, colors, Dropdown } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
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

export default () => {
    const {
        account: { networkType },
        getValues,
        addOpReturn,
    } = useSendFormContext();

    // getValues() and getValues('txType') returns different results - TODO: investigate
    const opreturnOutput = getValues('outputs')?.find(o => o.type === 'opreturn');
    const hasDropdown = networkType === 'bitcoin' && !opreturnOutput;
    return (
        <Wrapper>
            <HeaderLeft />
            <HeaderRight>
                <Clear />
                {hasDropdown && (
                    <Dropdown
                        alignMenu="right"
                        items={[
                            {
                                options: [
                                    {
                                        callback: addOpReturn,
                                        label: 'Add OP Return',
                                        isHidden: false,
                                    },
                                ],
                            },
                        ]}
                    />
                )}
            </HeaderRight>
        </Wrapper>
    );
};
