import React from 'react';

import { Select as SelectComponent, SelectProps } from '@trezor/components';
import { Field } from '../../types';
import { Row } from './Row';

interface Props {
    onChange: (field: Field<any>, value: string) => void;
    field: Field<any>;
    label: SelectProps['label'];
    value: SelectProps['value'];
    data: any[];
}

const Select: React.FC<Props> = ({ field, onChange, data }) => (
    <Row>
        todo: select vs coinselect
        <SelectComponent
            label={field.name}
            value={field.value}
            options={data}
            onChange={event => onChange(field, event.target.value)}
        />
    </Row>
);

export default Select;
