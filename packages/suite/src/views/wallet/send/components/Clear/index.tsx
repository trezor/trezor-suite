import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components';
import { useFormContext } from 'react-hook-form';
import { useSendContext } from '@wallet-hooks/useSendContext';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const In = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    color: ${colors.BLACK50};
`;

export default () => {
    const { reset } = useFormContext();
    const { initialSelectedFee, setSelectedFee } = useSendContext();

    return (
        <Wrapper>
            <In
                onClick={() => {
                    reset(
                        {
                            'ethereum-gas-price': initialSelectedFee.feePerUnit,
                            'ethereum-gas-limit': initialSelectedFee.feeLimit,
                        },
                        { dirty: true },
                    );
                    setSelectedFee(initialSelectedFee);
                }}
            >
                <Button variant="tertiary" icon="CLEAR" alignIcon="left">
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            </In>
        </Wrapper>
    );
};
