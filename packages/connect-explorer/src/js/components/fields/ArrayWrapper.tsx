/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import styled from 'styled-components';
import { Icon } from '@trezor/components';

import type { FieldWithBundle } from '../../types';

interface AddButtonProps {
    field: FieldWithBundle<any>;
    onAdd: () => void;
    label: string;
}

const AddBatchButton = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const AddButton: React.FC<AddButtonProps> = props => {
    const { field, onAdd, label } = props;
    if (field.batch.length > 1) {
        return null;
    }
    return (
        <AddBatchButton title="Add batch" onClick={onAdd}>
            <Icon icon="PLUS" onClick={() => {}} /> {label}
        </AddBatchButton>
    );
};

interface Props {
    field: FieldWithBundle<any>;
    onAdd: () => void;
}

const Array = styled.div`
    display: flex;
    flex-direction: column;
`;

const ArrayWrapper: React.FC<Props> = props => (
    <Array>
        <AddButton field={props.field} onAdd={props.onAdd} label={props.field.name} />
        <div>{props.children}</div>
    </Array>
);

export default ArrayWrapper;
