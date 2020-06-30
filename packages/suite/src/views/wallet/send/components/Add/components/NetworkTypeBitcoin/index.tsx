import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Select } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div`
    min-width: 90px;
`;

const StyledSelect = styled(Select)``;
const options = [{ value: 'RECIPIENT', label: <Translation id="TR_RECIPIENT" /> }];

export default () => {
    const { outputs, updateContext } = useSendFormContext().sendContext;

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
                        updateContext({ outputs: outputsWithNewItem });
                    }
                }}
                options={options}
            />
        </Wrapper>
    );
};
