import React from 'react';
import styled from 'styled-components';
import { Props } from '../../Container';
import { Select } from '@trezor/components-v2';

const Wrapper = styled.div`
    min-width: 80px;
`;

const StyledSelect = styled(Select)``;

const options = [{ value: 'RECIPIENT', label: 'Recipient' }];

interface ComponentProps {
    addRecipient: Props['sendFormActionsBitcoin']['addRecipient'];
}

const Add = (props: ComponentProps) => (
    <Wrapper>
        <StyledSelect
            display="block"
            isSearchable={false}
            isClearable={false}
            value={{ value: 'Add', label: 'Add' }}
            onChange={(change: { label: string; value: string }) => {
                if (change.value === 'RECIPIENT') {
                    props.addRecipient();
                }
            }}
            options={options}
        />
    </Wrapper>
);

export default Add;
