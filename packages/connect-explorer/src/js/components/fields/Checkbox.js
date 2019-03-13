/* @flow */

import React from 'react';

export default (props) => (
    <div className="row">
        <label className="custom-checkbox align-left">
            { props.field.label || props.field.name }
            <input type="checkbox" checked={ props.field.value } onChange={ event => props.onChange(props.field, event.target.checked) } />
            <span className="indicator"></span>
        </label>
    </div>
);