/* @flow */

import React from 'react';

const CoinSelect = (props): any => {
    const { field } = props;
    const options = field.data.map(c => {
        return (
            <option key={ c.value } value={ c.value }>{ c.label }</option>
        )
    });

    if (field.optional) {
        options.unshift(<option key='empty' value=''>{ field.placeholder || 'Select coin'}</option>);
    }

    return (
        <div className="row" >
            <label>{ props.field.label || props.field.name }</label>
            <select 
                value={ field.value } 
                onChange={(event) => {
                    // event.target.value is always string, if we want to keep number, we need to cast it back.
                    if (!isNaN(parseInt(event.target.value))) {
                        return props.onChange(field, parseInt(event.target.value))
                    }
                    return props.onChange(field, event.target.value);
                }}
            >
                { options }
            </select>
        </div>
    );
}

export default CoinSelect;