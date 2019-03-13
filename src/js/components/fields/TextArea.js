/* @flow */

import React from 'react';

export default (props) => (
    <div className="row">
        <label>{ props.field.label || props.field.name }</label>
        <textarea value={ props.field.value } onChange={ event => props.onChange(props.field, event.target.value) } />
    </div>
);