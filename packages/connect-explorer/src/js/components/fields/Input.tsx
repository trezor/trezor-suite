import React from 'react';
import { Input as InputComponent } from '@trezor/components';

import { Field } from '../../types';
import { Row } from './Row';

interface Props {
    onChange: (field: Field<any>, value: string) => void;
    field: Field<any>;
}

const Input: React.FC<Props> = props => (
    <Row>
        <InputComponent
            label={props.field.name}
            value={props.field.value}
            onChange={event => props.onChange(props.field, event.target.value)}
        />
    </Row>
);

export default Input;
