import React, { useEffect } from 'react';
import { Select } from '@trezor/components';
import { Field } from '../../types';

interface Props {
    field: Field;
    onDataChange: any;
    onChange: any;
}

const AsyncSelect = (props: Props) => {
    const { field } = props;

    useEffect(() => {
        if (field.data && field.data.length) {
            return;
        }
        const fetchWrapper = async () => {
            const data = await field.fetchData();
            props.onDataChange(field, data);
        };
        fetchWrapper();
    }, [field, props]);

    const onChange = async newValue => {
        const result = await field.onSelect(newValue.value);
        props.onChange(field, result);
    };

    return (
        <div className="row">
            <label>{field.label || field.name}</label>
            <Select onChange={onChange} options={field.data} />
        </div>
    );
};

export default AsyncSelect;
