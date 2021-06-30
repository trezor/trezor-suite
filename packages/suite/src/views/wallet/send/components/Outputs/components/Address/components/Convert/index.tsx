import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import type { ExtendedMessageDescriptor } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const StyledButton = styled(Button)`
    margin-left: 8px;
    padding: 0;
    background: none;
`;

interface Props {
    label: ExtendedMessageDescriptor['id'];
    onClick: () => void;
}

const Convert = ({ label, onClick }: Props) => (
    <Wrapper>
        <Translation
            id={label}
            isNested
            values={{
                a: chunks => (
                    <StyledButton variant="tertiary" onClick={onClick}>
                        {chunks}
                    </StyledButton>
                ),
            }}
        />
    </Wrapper>
);

export default Convert;
