import React from 'react';

import { Checkbox as CheckboxComponent } from '@trezor/components';
import type { CheckboxProps } from '@trezor/components';

import type { Field } from '../../types';
import { onFieldChange } from '../../actions/methodActions';
import { Row } from './Row';

interface Props {
    field: Field<boolean>;
    onChange: typeof onFieldChange;
}

const Checkbox: React.FC<Props> = props => (
    <Row>
        <CheckboxComponent
            onClick={e => props.onChange(props.field, !props.field.value)}
            isChecked={props.field.value}
        >
            {props.field.name}
        </CheckboxComponent>
    </Row>
);

export default Checkbox;
