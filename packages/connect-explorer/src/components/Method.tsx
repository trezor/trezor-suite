/* eslint-disable @typescript-eslint/no-use-before-define */
import { Inspector } from 'react-inspector';
import { useState, useCallback, useEffect } from 'react';

import styled, { useTheme } from 'styled-components';
import { CopyToClipboard } from 'nextra/components';

import { Button as TrezorButton, ButtonProps, H3, Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

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
import { CodeEditor } from './CodeEditor';

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

export const getFields = (fields: Field<any>[], props: Props) => {
    // Move all booleans to the end while not breaking the order of other fields
    const bools = fields.filter(f => f.type === 'checkbox');
    const nonBools = fields.filter(f => f.type !== 'checkbox');
    const boolsChildren = bools.map((batchField: any) => getField(batchField, props));
    const children = nonBools.map((batchField: any) => getField(batchField, props));

    return (
        <>
            {children}
            {boolsChildren.length > 0 && <Checkboxes>{boolsChildren}</Checkboxes>}
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
            return (
                <Card
                    key={field.name}
                    paddingType="small"
                    label={field.name}
                    margin={{ bottom: 8 }}
                >
                    <CodeEditor
                        code={
                            typeof field.value === 'string'
                                ? field.value
                                : JSON.stringify(field.value, null, 2)
                        }
                        codeChange={code => props.actions.onFieldChange(field, code)}
                    />
                </Card>
            );
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

export const MethodContent = styled.div<{ $manualMode?: boolean }>(
    ({ $manualMode }) => `
    display: grid;
    grid-template-columns: ${$manualMode ? '3fr 2fr' : '2fr 3fr'};
    gap: 20px;

    & > div {
        /* CSS grid obscurities */
        min-width: 0;
    }
`,
);

const Container = styled.div`
    position: relative;
    background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    border-radius: 12px;
    width: 100%;
    overflow-x: auto;
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    word-wrap: break-word;
    word-break: break-all;
    min-height: 150px;
    margin-bottom: 10px;

    ul,
    ol {
        list-style: none;
    }

    pre {
        padding: 0;
        width: 100%;
        overflow-x: scroll;
    }
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

const CopyWrapper = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    opacity: 0;
    transition: opacity 0.3s;

    div:hover > & {
        opacity: 1;
    }
`;

const Sticky = styled.div`
    position: sticky;
    top: 20px;
    align-self: flex-start;
    width: 100%;
`;

const Button = styled(TrezorButton)`
    margin-top: ${spacingsPx.sm};
`;

interface VerifyButtonProps {
    onClick: (url: string) => void;
    name: string;
}

export const VerifyButton = ({ name, onClick }: VerifyButtonProps) => {
    const signMethods = ['signMessage', 'ethereumSignMessage'];
    const verifyUrls = ['/method/verifyMessage', '/method/ethereumVerifyMessage'];
    const index = signMethods.indexOf(name);
    if (index < 0) return null;

    return <Button onClick={() => onClick(verifyUrls[index])}>Verify response</Button>;
};

type SubmitButtonProps = {
    onClick: ButtonProps['onClick'];
    isFullWidth?: ButtonProps['isFullWidth'];
    isLoading: ButtonProps['isLoading'];
    text?: string;
};

const SubmitButton = ({ onClick, text, isFullWidth, isLoading }: SubmitButtonProps) => {
    return (
        <Button
            onClick={onClick}
            data-test="@submit-button"
            isFullWidth={isFullWidth}
            isLoading={isLoading}
        >
            {text || 'Submit'}
        </Button>
    );
};

export const Method = () => {
    const theme = useTheme();
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
        onCodeChange: methodActions.onCodeChange,
    });

    const { onSubmit } = actions;

    const { name, submitButton, fields, javascriptCode, response, schema, manualMode, processing } =
        method;

    const [code, setCode] = useState('');

    const codeChange = useCallback(
        (val: string) => {
            setCode(val);
            actions.onCodeChange(val);
        },
        [actions],
    );
    useEffect(() => {
        // Don't override code when in manual mode
        if (!javascriptCode || manualMode) return;
        // Strip the function name and the brackets
        const start = javascriptCode.indexOf('(');
        const end = javascriptCode.lastIndexOf(')');
        const params = javascriptCode.slice(start + 1, end);
        setCode(params);
    }, [javascriptCode, manualMode]);

    if (!name) return null;

    const json = response ? (
        <Inspector
            theme={theme.THEME === 'light' ? 'chromeLight' : 'chromeDark'}
            data={response}
            expandLevel={10}
            table={false}
        />
    ) : null;

    const buttonProps: SubmitButtonProps = {
        onClick: onSubmit,
        text: submitButton,
        isLoading: processing,
    };

    return (
        <MethodContent $manualMode={manualMode}>
            <div>
                {manualMode ? (
                    <Container>
                        <Heading>Method with params</Heading>
                        <CodeEditor {...{ code, codeChange, schema }} />
                        <CopyWrapper>
                            <CopyToClipboard getValue={() => javascriptCode ?? ''} />
                        </CopyWrapper>

                        <SubmitButton {...buttonProps} />
                    </Container>
                ) : (
                    getFields(fields, { actions })
                )}
            </div>
            <div>
                <Sticky>
                    {!manualMode && (
                        <Container data-test="@code">
                            <Heading>Method with params</Heading>
                            <CopyWrapper>
                                <CopyToClipboard getValue={() => javascriptCode ?? ''} />
                            </CopyWrapper>
                            <pre>{javascriptCode}</pre>
                            <SubmitButton {...buttonProps} isFullWidth />
                        </Container>
                    )}
                    <Container data-test="@response">
                        <Heading>Response</Heading>
                        <CopyWrapper>
                            <CopyToClipboard getValue={() => JSON.stringify(response, null, 2)} />
                        </CopyWrapper>
                        {json}
                        {/*response && response.success && (
                            <VerifyButton name={name} onClick={onVerify} />
                        )*/}
                    </Container>
                </Sticky>
            </div>
        </MethodContent>
    );
};
