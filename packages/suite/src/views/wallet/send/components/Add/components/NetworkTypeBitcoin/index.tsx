import { Translation } from '@suite-components';
import { Select } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    min-width: 90px;
`;

const StyledSelect = styled(Select)``;

const options = [{ value: 'RECIPIENT', label: <Translation id="TR_RECIPIENT" /> }];

interface ComponentProps {
    addOutput: () => {};
}

export default (props: ComponentProps) => (
    <Wrapper>
        <StyledSelect
            variant="small"
            isSearchable={false}
            isClearable={false}
            value={{ value: 'Add', label: 'Add...' }}
            onChange={(change: { label: string; value: string }) => {
                if (change.value === 'RECIPIENT') {
                    props.addOutput();
                }
            }}
            options={options}
        />
    </Wrapper>
);
