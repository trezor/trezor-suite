/* eslint-disable @typescript-eslint/no-use-before-define */
import { Inspector } from 'react-inspector';

import styled from 'styled-components';

import { Button, H3 } from '@trezor/components';

import type { Field, FieldWithBundle, FieldWithUnion } from '../types';
import * as methodActions from '../actions/methodActions';
import { useSelector, useActions } from '../hooks';
import {
    Input,
    TextArea,
    Checkbox,
    CoinSelect,
    ArrayWrapper,
    BatchWrapper,
    UnionWrapper,
    File,
} from './fields';
import { Row } from './fields/Row';
import { CopyToClipboard } from './CopyToClipboard';

interface Props {
    actions: {
        onSubmit: typeof methodActions.onSubmit;
        onVerify: typeof methodActions.onVerify;
        onBatchAdd: typeof methodActions.onBatchAdd;
        onBatchRemove: typeof methodActions.onBatchRemove;
        onFieldChange: typeof methodActions.onFieldChange;
        onFieldDataChange: typeof methodActions.onFieldDataChange;
        onSetUnion: typeof methodActions.onSetUnion;
    };
}

const getFields = (fields: Field<any>[], props: Props) => {
    // Move all booleans to the end while not breaking the order of other fields
    const bools = fields.filter(f => f.type === 'checkbox');
    const nonBools = fields.filter(f => f.type !== 'checkbox');
    const boolsChildren = bools.map((batchField: any) => getField(batchField, props));
    const children = nonBools.map((batchField: any) => getField(batchField, props));

    return (
        <>
            {children}
            <Checkboxes>{boolsChildren}</Checkboxes>
        </>
    );
};

const getArray = (field: FieldWithBundle<any>, props: Props) => (
    <ArrayWrapper
        key={field.name}
        field={field}
        onAdd={() => props.actions.onBatchAdd(field, field.batch[0].fields)}
    >
        {field.items?.map((batch, index) => {
            const key = `${field.name}-${index}`;

            return (
                <BatchWrapper key={key} onRemove={() => props.actions.onBatchRemove(field, batch)}>
                    {getFields(batch, props)}
                </BatchWrapper>
            );
        })}
    </ArrayWrapper>
);

const getUnion = (field: FieldWithUnion<any>, props: Props) => (
    <UnionWrapper
        field={field}
        onChange={(option: number) => props.actions.onSetUnion(field, field.options[option])}
    >
        {getFields(field.current, props)}
    </UnionWrapper>
);

export const getField = (field: Field<any> | FieldWithBundle<any>, props: Props) => {
    switch (field.type) {
        case 'array':
            return getArray(field, props);
        case 'union':
            return getUnion(field, props);
        case 'input':
        case 'input-long':
        case 'number':
            return (
                <Input
                    dataTest={`@input/${field.name}`}
                    key={field.name}
                    field={field}
                    onChange={props.actions.onFieldChange}
                />
            );
        case 'address':
            return <Input key={field.name} field={field} onChange={props.actions.onFieldChange} />;

        case 'checkbox':
            return (
                <Checkbox
                    data-test={`@checkbox/${field.name}`}
                    key={field.name}
                    field={field}
                    onChange={props.actions.onFieldChange}
                />
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
        case 'file':
            return <File key={field.name} field={field} onChange={props.actions.onFieldChange} />;
        default:
            return null;
    }
};

const MethodContent = styled.section`
    flex: 1;
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 20px;

    & > div {
        display: flex;
        flex-direction: column;
    }
`;

const Container = styled.div`
    position: relative;
    background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    border-radius: 12px;
    width: 100%;
    padding: 10px;
    word-wrap: break-word;
    word-break: break-all;
    min-height: 150px;

    ul,
    ol {
        list-style: none;
    }
`;

const CodeContainer = styled(Container)`
    white-space: pre;
`;

const Heading = styled(H3)`
    font-size: 16px;
    font-weight: 600;
`;

const Checkboxes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0 10px;
`;

interface VerifyButtonProps {
    onClick: (url: string) => void;
    name: string;
}

const VerifyButton = ({ name, onClick }: VerifyButtonProps) => {
    const signMethods = ['signMessage', 'ethereumSignMessage'];
    const verifyUrls = ['/method/verifyMessage', '/method/ethereumVerifyMessage'];
    const index = signMethods.indexOf(name);
    if (index < 0) return null;

    return <Button onClick={() => onClick(verifyUrls[index])}>Verify response</Button>;
};

export const Method = () => {
    const { method } = useSelector(state => ({
        method: state.method,
    }));
    const actions = useActions({
        onSubmit: methodActions.onSubmit,
        onVerify: methodActions.onVerify,
        onBatchAdd: methodActions.onBatchAdd,
        onBatchRemove: methodActions.onBatchRemove,
        onFieldChange: methodActions.onFieldChange,
        onFieldDataChange: methodActions.onFieldDataChange,
        onSetUnion: methodActions.onSetUnion,
    });

    const { onSubmit, onVerify } = actions;

    const { name, submitButton, fields, javascriptCode, response } = method;

    if (!name) return null;

    const json = response ? <Inspector data={response} expandLevel={10} table={false} /> : null;

    return (
        <MethodContent>
            <div>
                <Heading>Params</Heading>
                {getFields(fields, { actions })}
                <Row>
                    <Button onClick={onSubmit} data-test="@submit-button">
                        {submitButton}
                    </Button>
                    {response && response.success && (
                        <VerifyButton name={name} onClick={onVerify} />
                    )}
                </Row>
                <Heading>Method with params</Heading>
                <CodeContainer data-test="@code">
                    <CopyToClipboard data={javascriptCode} />
                    {javascriptCode}
                </CodeContainer>
            </div>
            <div>
                <Heading>Response</Heading>
                <Container data-test="@response">
                    <CopyToClipboard data={JSON.stringify(response, null, 2)} />
                    {json}
                </Container>
            </div>
        </MethodContent>
    );
};
