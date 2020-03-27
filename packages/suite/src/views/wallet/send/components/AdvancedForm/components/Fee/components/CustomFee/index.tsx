import React from 'react';
import styled from 'styled-components';
import { Account, Send } from '@wallet-types';
import { Translation } from '@suite-components/Translation';
import { Input, Select } from '@trezor/components';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';

import { Props } from './Container';

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

export default ({ send, sendFormActions, account }: Props) => {
    if (!send || !account) return null;
    const { customFee, feeInfo } = send;
    const { value, error } = customFee;
    const { maxFee, minFee } = feeInfo;
    const { networkType } = account;

    return (
        <Wrapper>
            <ItemWrapper>
                <Input
                    display="block"
                    variant="small"
                    state={getInputState(error, value, true, false)}
                    bottomText={getError(error, maxFee, minFee)}
                    value={value || ''}
                    onChange={e => {
                        sendFormActions.handleCustomFeeValueChange(e.target.value);
                    }}
                />
            </ItemWrapper>
            <ItemWrapper>
                <Select display="block" variant="small" isDisabled value={getValue(networkType)} />
            </ItemWrapper>
        </Wrapper>
    );
};
