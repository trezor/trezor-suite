import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { useSendFormContext } from '@wallet-hooks';
import React, { useEffect } from 'react';
import styled from 'styled-components';

import Address from './components/Address';
import Amount from './components/Amount';
import Header from './components/Header';

const Wrapper = styled.div``;

const OutputWrapper = styled.div`
    padding: 0 12px 12px 12px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 30px 0;

    &:last-child {
        padding: 0;
    }
`;

export default () => {
    const { formContext, sendContext } = useSendFormContext();
    const { getValues, setValue, clearError, setError } = formContext;
    const { outputs, coinFees, selectedFee, token, fiatRates } = sendContext;

    // const outputs = getValues('outputs');
    // const coinFees = getValues('coinFees');
    // const selectedFee = getValues('selectedFee');
    // const token = getValues('token');
    // const fiatRates = getValues('fiatRates');
    const { updateFeeLevel } = useActions({ updateFeeLevel: sendFormActions.updateFeeLevel });

    // useEffect(() => {
    //     if (selectedFee.label === 'custom') {
    //         setValue('feeOutdated', true);
    //     } else {
    //         // updateFeeLevel(
    //         //     coinFees,
    //         //     token,
    //         //     setValue,
    //         //     setSelectedFee,
    //         //     outputs,
    //         //     getValues,
    //         //     clearError,
    //         //     setError,
    //         //     fiatRates,
    //         //     setTransactionInfo,
    //         // );
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [coinFees]);

    // useEffect(() => {
    //     if (Object.keys(errors).length === 0 && Object.keys(formState.touched).length > 0) {
    //         console.log('formValues', formValues);
    //         saveDraft(formValues, outputs);
    //     }
    // }, [formValues, outputs, saveDraft, formState, errors]);

    return (
        <Wrapper>
            {outputs.map((output, index) => (
                <OutputWrapper key={output.id}>
                    <Header outputIndex={index} outputId={output.id} />
                    <Row>
                        <Address outputId={output.id} />
                    </Row>
                    <Row>
                        <Amount outputId={output.id} />
                    </Row>
                </OutputWrapper>
            ))}
        </Wrapper>
    );
};
