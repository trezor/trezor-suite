import styled from 'styled-components';

import { SelectBar } from '@trezor/components';

import { FieldWithUnion } from '../../types';

const UnionHeader = styled.div`
    word-wrap: break-word;
    word-break: break-all;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-left: 4px;

    p {
        margin: 0;
    }
`;

const Wrapper = styled.div`
    margin-bottom: 8px;
`;

interface UnionWrapperProps {
    field: FieldWithUnion<any>;
    onChange: (value: number) => void;
    children: React.ReactNode;
}

export const UnionWrapper = ({ field, onChange, children }: UnionWrapperProps) => {
    return (
        <Wrapper>
            <UnionHeader>
                <p>Union</p>
                <SelectBar
                    selectedOption={0}
                    options={field.labels.map((label, index) => ({ value: index, label }))}
                    onChange={onChange}
                />
            </UnionHeader>
            {children}
        </Wrapper>
    );
};
