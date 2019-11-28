import React from 'react';
import { Field } from '../../types';

interface Props {
    field: Field;
    onChange: any;
}

const CoinSelect: React.FC<Props> = props => {
    const { field } = props;
    const options = field.data.map(c => {
        return (
            <option key={c.value} value={c.value}>
                {c.label}
            </option>
        );
    });

    if (field.optional) {
        options.unshift(
            <option key="empty" value="">
                {field.placeholder || 'Select coin'}
            </option>,
        );
    }

    return (
        <div className="row">
            <label>{props.field.label || props.field.name}</label>
            <select
                value={field.value}
                onChange={event => {
                    // event.target.value is always string, if we want to keep number, we need to cast it back.
                    if (!Number.isNaN(parseInt(event.target.value, 10))) {
                        return props.onChange(field, parseInt(event.target.value, 10));
                    }
                    return props.onChange(field, event.target.value);
                }}
            >
                {options}
            </select>
        </div>
    );
};

export default CoinSelect;
