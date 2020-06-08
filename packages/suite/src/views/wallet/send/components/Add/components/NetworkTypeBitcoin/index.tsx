import { Translation } from '@suite-components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Select } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    min-width: 90px;
`;

const StyledSelect = styled(Select)``;
const options = [{ value: 'RECIPIENT', label: <Translation id="TR_RECIPIENT" /> }];

export default () => {
    const { updateOutputs, outputs } = useSendContext();

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
                            {
                                id: lastOutput.id + 1,
                            },
                        ];
                        updateOutputs(outputsWithNewItem);
                    }
                }}
                options={options}
            />
        </Wrapper>
    );
};
