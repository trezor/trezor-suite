import styled from 'styled-components';

import { Textarea as TextareaComponent } from '@trezor/components';

import { FieldBasic } from '../../types';

const Row = styled.div`
    display: block;
    padding-bottom: 10px;
`;

interface TextareaProps {
    field: FieldBasic<string>;
    onChange: (field: FieldBasic<string>, value: string) => any;
}

const Textarea = ({ field, onChange }: TextareaProps) => (
    <Row>
        <TextareaComponent
            label={field.name}
            value={field.value}
            onChange={event => onChange(field, event.target.value)}
        />
    </Row>
);

export default Textarea;
