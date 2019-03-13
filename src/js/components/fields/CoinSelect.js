/* @flow */

import React from 'react';

export const Select = (props) => {
    return (
        <select value={ field.value } onChange={ event => props.onChange(field, event.target.value) }>
            { options }
        </select>
    );
}

const CoinSelect = (props): any => {

    const { field } = props;
    const options = field.data.map(c => {
        return (
            <option key={ c.value } value={ c.value }>{ c.label }</option>
        )
    });

    if (field.optional) {
        options.unshift(<option key='empty' value=''>Select coin</option>);
    }

    return (
        <div className="row" >
            <label>{ props.field.label || props.field.name }</label>
            <select value={ field.value } onChange={ event => props.onChange(field, event.target.value) }>
                { options }
            </select>
        </div>
    );
}

export default CoinSelect;