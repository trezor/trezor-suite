/* eslint-disable @typescript-eslint/no-use-before-define */
import React from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';

import type { Field, FieldWithBundle, AppState } from '../types';

import * as methodActions from '../actions/methodActions';
import { useSelector, useActions } from '../hooks';

import { Input, TextArea, Checkbox, CoinSelect, ArrayWrapper, BatchWrapper, File } from './fields';
import { Row } from './fields/Row';
import Response from './Response';

interface Props {
    method: AppState['method'];
    docs: AppState['docs'];
    actions: any; // todo
}

const getArray = (field: FieldWithBundle<any>, props: Props) => (
    <ArrayWrapper
        key={field.name}
        field={field}
        onAdd={() => props.actions.onBatchAdd(field, field.batch[0].fields)}
    >
        {field.items?.map((batch, index) => {
            const key = `${field.name}-${index}`;
            const children = batch.map((batchField: any) => getField(batchField, props));
            return (
                <BatchWrapper key={key} onRemove={() => props.actions.onBatchRemove(field, batch)}>
                    {children}
                </BatchWrapper>
            );
        })}
    </ArrayWrapper>
);

const getField = (field: Field<any> | FieldWithBundle<any>, props: Props) => {
    switch (field.type) {
        case 'array':
            return getArray(field, props);
        case 'input':
        case 'input-long':
        case 'number':
            return <Input key={field.name} field={field} onChange={props.actions.onFieldChange} />;
        case 'address':
            return (
                <Input
                    key={field.name}
                    field={field}
                    // validation={props.method.addressValidation}
                    onChange={props.actions.onFieldChange}
                />
            );

        case 'checkbox':
            return (
                <Checkbox key={field.name} field={field} onChange={props.actions.onFieldChange} />
            );
        case 'json':
        case 'textarea':
        case 'function':
            return (
                <TextArea key={field.name} field={field} onChange={props.actions.onFieldChange} />
            );
        case 'select':
            return (
                <CoinSelect key={field.name} field={field} onChange={props.actions.onFieldChange} />
            );
        // case 'select-async':
        //     return (
        //         <AsyncSelect
        //             key={field.name}
        //             field={field}
        //             onDataChange={props.actions.onFieldDataChange}
        //             onChange={props.actions.onFieldChange}
        //         />
        //     );
        case 'file':
            return <File key={field.name} field={field} onChange={props.actions.onFieldChange} />;
        default:
            return null;
    }
};

const MethodContent = styled.section`
    flex: 1;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
`;

interface VerifyButtonProps {
    onClick: (url: string) => void;
    name: string;
}

const VerifyButton: React.FC<VerifyButtonProps> = props => {
    const signMethods = ['signMessage', 'ethereumSignMessage'];
    const verifyUrls = ['/method/verifyMessage', '/method/ethereumVerifyMessage'];
    const index = signMethods.indexOf(props.name);
    if (index < 0) return null;

    return <Button onClick={() => props.onClick(verifyUrls[index])}>Verify response</Button>;
};

const Method = () => {
    const { method, docs } = useSelector(state => ({
        method: state.method,
        docs: state.docs,
    }));
    const actions = useActions({
        onSubmit: methodActions.onSubmit,
        onVerify: methodActions.onVerify,
        onBatchAdd: methodActions.onBatchAdd,
        onBatchRemove: methodActions.onBatchRemove,
        onFieldChange: methodActions.onFieldChange,
        onFieldDataChange: methodActions.onFieldDataChange,
    });

    const { onSubmit, onVerify } = actions;

    const { name, submitButton, fields, tab, javascriptCode, response } = method;

    if (!name) return null;

    const documentation = docs?.find(d => d.name === name);

    return (
        <MethodContent>
            {fields.map(field => getField(field, { method, docs, actions }))}
            <Row>
                <Button onClick={onSubmit}>{submitButton}</Button>
                {response && response.success && <VerifyButton name={name} onClick={onVerify} />}
            </Row>
            <Response
                response={response}
                code={javascriptCode}
                hasDocumentation={!!docs}
                docs={documentation && documentation.html}
                tab={tab}
            />
        </MethodContent>
    );
};

export default Method;
