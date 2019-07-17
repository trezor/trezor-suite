/* @flow */

import React from 'react';

export const Select = (props) => {
    return (
        <select value={ field.value } onChange={ event => props.onChange(field, event.target.value) }>
            { options }
        </select>
    );
}

export default Select;