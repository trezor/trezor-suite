import React from 'react';
import styled from 'styled-components';
import { Account, Send } from '@wallet-types';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { useFormContext } from 'react-hook-form';
import { Translation } from '@suite-components/Translation';
import { Input, Select } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';

const Wrapper = styled.div`
    display: flex;
`;

const ItemWrapper = styled.div`
    min-width: 80px;
    max-width: 80px;
    padding-right: 10px;
`;

const getError = (
    error: Send['customFee']['error'],
    maxFee: Send['feeInfo']['maxFee'],
    minFee: Send['feeInfo']['minFee'],
) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation id="TR_CUSTOM_FEE_IS_NOT_SET" />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation id="TR_CUSTOM_FEE_IS_NOT_VALID" />;
        case VALIDATION_ERRORS.NOT_IN_RANGE:
            return <Translation id="TR_CUSTOM_FEE_NOT_IN_RANGE" values={{ maxFee, minFee }} />;
        default:
            return null;
    }
};

const getValue = (networkType: Account['networkType']) => {
    if (networkType === 'bitcoin') {
        return { value: 'sat', label: 'sat/B' };
    }

    if (networkType === 'ripple') {
        return { value: 'drop', label: 'drops' };
    }
};

export default () => {
    const { account } = useSendContext();
    const { register } = useFormContext();
    const { networkType } = account;
    let maxFee = '1';
    let minFee = '2000';

    return (
        <Wrapper>
            <ItemWrapper>
                <Input variant="small" />
            </ItemWrapper>
            <ItemWrapper>
                <Select
                    name="customFee"
                    innerRef={register()}
                    variant="small"
                    isDisabled
                    value={getValue(networkType)}
                />
            </ItemWrapper>
        </Wrapper>
    );
};
