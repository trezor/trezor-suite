/* @flow */

import React from 'react';

const getClassName = (type: string, validation: ?boolean): string => {
    if (type === 'input' || type === 'number') return 'small';
    if (validation) return 'validation';
    return '';
}

export default (props) => (
    <div className="row">
        <label>{ props.field.label || props.field.name }</label>
        <input type="text" className={ getClassName(props.field.type, props.validation) } value={ props.field.value } onChange={ event => props.onChange(props.field, event.target.value) } />
    </div>
);