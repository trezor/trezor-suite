import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import type { ExtendedMessageDescriptor } from 'src/types/suite';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const StyledButton = styled(Button)`
    margin-left: 8px;
    padding: 0;
    background: none;
`;

interface ConvertAddressProps {
    label: ExtendedMessageDescriptor['id'];
    onClick: () => void;
}

export const ConvertAddress = ({ label, onClick }: ConvertAddressProps) => (
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
