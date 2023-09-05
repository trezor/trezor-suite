import styled from 'styled-components';
import { Textarea as TextareaComponent } from '@trezor/components';

import { Field } from '../../types';

const Row = styled.div`
    display: block;
    padding-bottom: 10px;
`;

interface TextareaProps {
    field: Field<string>;
    onChange: (field: Field<string>, value: string) => any;
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
