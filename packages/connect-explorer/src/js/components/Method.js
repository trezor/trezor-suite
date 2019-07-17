/* @flow */

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {Button} from 'trezor-ui-components';
import * as MethodActions from '../actions/MethodActions';

import {
    Input,
    TextArea,
    Checkbox,
    CoinSelect,
    AsyncSelect,
    Response,
    ArrayWrapper,
    BatchWrapper,
    File,
} from './fields';

const getArray = (field, props) => {
    const items = field.items.map((batch, index) => {
        const key = `${field.name}-${index}`;
        const children = batch.map(batchField => {
            return getField(batchField, props);
        });
        return (
            <BatchWrapper key={key} onRemove={ props.actions.onBatchRemove.bind(this, field, batch) }>
                { children }
            </BatchWrapper>
        )
    });
    return (
        <ArrayWrapper key={field.name} field={field} onAdd={ props.actions.onBatchAdd.bind(this, field) }>
            { items }
        </ArrayWrapper>
    );
}

const getField = (field, props) => {
    switch (field.type) {
        case 'array':
            return getArray(field, props);
        case 'input':
        case 'input-long':
        case 'number':
            return <Input key={field.name} field={field} onChange={props.actions.onFieldChange} />;
        case 'address':
            return <Input key={field.name} field={field} validation={props.method.addressValidation} onChange={props.actions.onFieldChange} />;

        case 'checkbox':
            return <Checkbox key={field.name} field={field} onChange={props.actions.onFieldChange} />;
        case 'json':
        case 'textarea':
        case 'function':
            return <TextArea key={field.name} field={field} onChange={props.actions.onFieldChange} />;
        case 'select':
            return <CoinSelect key={field.name} field={field} onChange={props.actions.onFieldChange} />;
        case 'select-async': 
            return <AsyncSelect key={field.name} field={field} onDataChange={props.actions.onFieldDataChange} onChange={props.actions.onFieldChange} />;
        case 'file':
            return <File key={field.name} field={field} onChange={props.actions.onFieldChange}/>
        default:
            return null;
    }
}

const VerifyButton = (props) => {
    const signMethods = [
        'signMessage',
        'ethereumSignMessage',
        'liskSignMessage',
    ];
    const verifyUrls = [
        '/method/verifyMessage',
        '/method/ethereumVerifyMessage',
        '/method/liskVerifyMessage',
    ];
    const index = signMethods.indexOf(props.name);
    if (index < 0) return null;

    return (
        <Button onClick={event => props.onClick(verifyUrls[index]) }>Verify response</Button>
    );
}

const Method = (props) => {
    const {
        onTabChange,
        onSubmit,
        onVerify,
    } = props.actions;

    const {
        name,
        docs,
        description,
        submitButton,
        fields,
        params,
        tab,
        javascriptCode,
        response,
    } = props.method;

    if (!name) return null;

    const documentation = props.docs.find(d => d.name === name);
    const body = fields.map(field => getField(field, props));

    return (
        <section className="method-content">
            <div className="method-params">
                { body }
                <div className="row">
                    <button onClick={onSubmit}>{ submitButton }</button>
                    { response && response.success && (<VerifyButton name={name} onClick={onVerify} />) }
                </div>
            </div>
            <Response 
                response={ response }
                code={ javascriptCode }
                hasDocumentation={ docs }
                docs= { documentation ? documentation.html : null }
                tab={ tab }
                onTabChange={ onTabChange } />
        </section>
    );
}

export default connect( 
    (state: State) => {
        return {
            method: state.method,
            docs: state.docs,
        };
    },
    (dispatch: Dispatch) => {
        return {
            actions: bindActionCreators(MethodActions, dispatch),
        };
    }
)(Method);