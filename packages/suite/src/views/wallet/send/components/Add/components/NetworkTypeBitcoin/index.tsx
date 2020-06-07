import { Translation } from '@suite-components';
import { useSendContext, SendContext } from '@suite/hooks/wallet/useSendContext';
import { Select } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    min-width: 90px;
`;

const StyledSelect = styled(Select)``;
const options = [{ value: 'RECIPIENT', label: <Translation id="TR_RECIPIENT" /> }];

const getNewOutput = (
    outputId: number,
    defaultLocalCurrencyOption: SendContext['defaultLocalCurrencyOption'],
) => {
    const newId = outputId + 1;
    return {
        id: newId,
        [`address-${newId}`]: '',
        [`amount-${newId}`]: '',
        [`settMaxActive-${newId}`]: false,
        [`fiatValue-${newId}`]: '',
        [`local-currency-${newId}`]: defaultLocalCurrencyOption,
    };
};

export default () => {
    const { updateOutputs, outputs, defaultLocalCurrencyOption } = useSendContext();

    return (
        <Wrapper>
            <StyledSelect
                variant="small"
                isSearchable={false}
                isClearable={false}
                value={{ value: 'Add', label: 'Add...' }}
                onChange={(change: { label: string; value: string }) => {
                    if (change.value === 'RECIPIENT') {
                        const lastOutput = outputs[outputs.length - 1];
                        const outputsWithNewItem = [
                            ...outputs,
                            getNewOutput(lastOutput.id, defaultLocalCurrencyOption),
                        ];
                        updateOutputs(outputsWithNewItem);
                    }
                }}
                options={options}
            />
        </Wrapper>
    );
};
