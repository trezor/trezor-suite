/* @flow */

import React, { PureComponent } from 'react';
import Select from './Select';

class AddButton extends PureComponent {
    render() {
        const { field, onAdd } = this.props;
        if (field.batch.length > 1) {
            // const sd = {
            //     data: field.batch.map(b => {
            //         return {
            //             value: b.type,
            //             label: b.type
            //         }
            //     });
            // }
            // return <Select field={ sd }></Select>;
            return null;
        }
        return (
            <div className="add-batch" title="Add batch" onClick={ event => onAdd(field.batch[0].fields) }>
                <svg viewBox="0 0 510 510" width="16px" height="16px">
                    <path d="M280.5,153h-51v76.5H153v51h76.5V357h51v-76.5H357v-51h-76.5V153z M255,0C114.75,0,0,114.75,0,255s114.75,255,255,255 s255-114.75,255-255S395.25,0,255,0z M255,459c-112.2,0-204-91.8-204-204S142.8,51,255,51s204,91.8,204,204S367.2,459,255,459z" />
                </svg>
            </div>
        )
    }
}

export default (props) => (
    <div className="array">
        <label>
            <AddButton { ...props } />
            { props.field.label || props.field.name }
        </label>
        <div>
            { props.children }
        </div>
        
    </div>
);