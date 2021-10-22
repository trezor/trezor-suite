import React from 'react';
import styled from 'styled-components';
import { Textarea as TextareaComponent } from '@trezor/components';

import { Field } from '../../types';

const Row = styled.div`
    display: block;
    padding-bottom: 10px;
`;

interface Props {
    field: Field<string>;
    onChange: (field: Field<string>, value: string) => any;
}

const Textarea: React.FC<Props> = props => (
    <Row>
        <TextareaComponent
            label={props.field.name}
            value={props.field.value}
            onChange={event => props.onChange(props.field, event.target.value)}
        />
    </Row>
);

export default Textarea;
