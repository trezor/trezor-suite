/* eslint-disable @typescript-eslint/no-use-before-define */
import { useCallback, useEffect, useState } from 'react';
import { Inspector } from 'react-inspector';

import { CopyToClipboard } from 'nextra/components';
import styled, { useTheme } from 'styled-components';

import {
    Button,
    type ButtonProps,
    Card,
    IconButton,
    Row,
    Text,
    variables,
} from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import * as methodActions from '../actions/methodActions';
import { useActions, useSelector } from '../hooks';
import type { Field, FieldWithBundle, FieldWithUnion } from '../types';
import { CodeEditor } from './CodeEditor';
import {
    ArrayWrapper,
    BatchWrapper,
    Checkbox,
    CoinSelect,
    File,
    Input,
    TextArea,
    UnionWrapper,
} from './fields';

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
        onAdd={() => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstBatch: (typeof field.batch)[number] = field.batch[0];
            props.actions.onBatchAdd(field, firstBatch.fields);
        }}
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
                    data-testid={`@input/${field.name}`}
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
                    data-testid={`@checkbox/${field.name}`}
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

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-template-columns: 1fr;
    }

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
    overflow-wrap: break-word;
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

interface VerifyButtonProps {
    onClick: (url: string) => void;
    name: string;
}

export const VerifyButton = ({ name, onClick }: VerifyButtonProps) => {
    const signMethods = ['signMessage', 'ethereumSignMessage'];
    const verifyUrls = ['/method/verifyMessage', '/method/ethereumVerifyMessage'];
    const index = signMethods.indexOf(name);
    if (index < 0) return null;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const verifyUrl: string = verifyUrls[index];

    return (
        <Button margin={{ top: 12 }} onClick={() => onClick(verifyUrl)}>
            Verify response
        </Button>
    );
};

type SubmitButtonProps = {
    onClick: ButtonProps['onClick'];
    isLoading: boolean;
    text?: string;
};

const SubmitButton = ({ onClick, text, isLoading }: SubmitButtonProps) => (
    <Button onClick={onClick} data-testid="@submit-button" flex="1" isLoading={isLoading}>
        {text || 'Submit'}
    </Button>
);

export const Method = () => {
    const theme = useTheme();
    const method = useSelector(state => state.method);
    const actions = useActions({
        onSubmit: methodActions.onSubmit,
        onCancelCall: methodActions.onCancelCall,
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
            theme={theme.mode === 'light' ? 'chromeLight' : 'chromeDark'}
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
                        <Text typographyStyle="body-md-strong">Method with params</Text>
                        <CodeEditor {...{ code, codeChange, schema }} />
                        <CopyWrapper>
                            <CopyToClipboard getValue={() => javascriptCode ?? ''} />
                        </CopyWrapper>

                        <Row gap={4} margin={{ top: 12 }}>
                            <SubmitButton {...buttonProps} />
                            {buttonProps.isLoading && (
                                <IconButton
                                    icon="x"
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={() => actions.onCancelCall()}
                                />
                            )}
                        </Row>
                    </Container>
                ) : (
                    getFields(fields, { actions })
                )}
            </div>
            <div>
                <Sticky>
                    {!manualMode && (
                        <Container data-testid="@code">
                            <Text typographyStyle="body-md-strong">Method with params</Text>
                            <CopyWrapper>
                                <CopyToClipboard getValue={() => javascriptCode ?? ''} />
                            </CopyWrapper>
                            <pre>{javascriptCode}</pre>
                            <Row gap={4} margin={{ top: 12 }}>
                                <SubmitButton {...buttonProps} />
                                {buttonProps.isLoading && (
                                    <IconButton
                                        icon="x"
                                        intent="neutral"
                                        priority="secondary"
                                        data-testid="@cancel-button"
                                        onClick={() => actions.onCancelCall()}
                                    />
                                )}
                            </Row>
                        </Container>
                    )}
                    <Container data-testid="@response">
                        <Text typographyStyle="body-md-strong">Response</Text>
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
