import React, { useEffect, useState } from 'react';
import { Select } from 'trezor-ui-components';

const AsyncSelect = (props) => {
    const { field } = props;

    useEffect(() => {
        const fetchWrapper = async () => {
            const data = await field.fetchData();
            props.onDataChange(field, data);
        }
        fetchWrapper();
    }, [])

    const onChange = async (newValue) => {
        const result = await field.onSelect(newValue.value);
        props.onChange(field, result)
    }

    return (
        <div className="row" >
            <label>{ field.label || field.name }</label>
            <Select 
                onChange={onChange}
                options={field.data}
            />
        </div>
    );
}

export default AsyncSelect;
