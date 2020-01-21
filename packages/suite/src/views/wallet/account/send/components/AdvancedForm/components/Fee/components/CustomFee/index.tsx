import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { State } from '@wallet-types/sendForm';
import { Translation } from '@suite-components/Translation';
import { Input, Select } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import messages from '@suite/support/messages';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
`;

const ItemWrapper = styled.div`
    min-width: 80px;
    max-width: 80px;
    padding-right: 10px;
`;

const getErrorMessage = (
    error: State['customFee']['error'],
    maxFee: State['feeInfo']['maxFee'],
    minFee: State['feeInfo']['minFee'],
) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation {...messages.TR_CUSTOM_FEE_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation {...messages.TR_CUSTOM_FEE_IS_NOT_VALID} />;
        case VALIDATION_ERRORS.NOT_IN_RANGE:
            return (
                <Translation {...messages.TR_CUSTOM_FEE_NOT_IN_RANGE} values={{ maxFee, minFee }} />
            );
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

const CustomFee = ({ send, sendFormActions, account }: Props) => {
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
                    state={getInputState(error, value)}
                    bottomText={getErrorMessage(error, maxFee, minFee)}
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

export default CustomFee;
