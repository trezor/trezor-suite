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
    const {
        initialSelectedFee,
        setSelectedFee,
        localCurrencyOption,
        updateOutputs,
    } = useSendContext();

    return (
        <Wrapper>
            <In
                onClick={() => {
                    reset(
                        {
                            'address-0': '',
                            'amount-0': '',
                            'settMaxActive-0': false,
                            'fiatValue-0': '',
                            'localCurrency-0': localCurrencyOption,
                            ethereumGasPrice: initialSelectedFee.feePerUnit,
                            ethereumGasLimit: initialSelectedFee.feeLimit,
                            ethereumData: '',
                            rippleDestinationTag: '',
                        },
                        { dirty: true },
                    );
                    setSelectedFee(initialSelectedFee);
                    updateOutputs([
                        {
                            id: 0,
                            'address-0': '',
                            'amount-0': '',
                            'setMaxActive-0': false,
                            'fiatValue-0': '',
                            'local-currency-0': localCurrencyOption,
                        },
                    ]);
                }}
            >
                <Button variant="tertiary" icon="CLEAR" alignIcon="left">
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            </In>
        </Wrapper>
    );
};
