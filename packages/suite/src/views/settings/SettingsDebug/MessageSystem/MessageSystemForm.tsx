import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from 'styled-components';

import {
    CATEGORY_OPTIONS,
    CONDITION_OPTIONS,
    CONTEXT_PATTERNS,
    FEATURE_LIST,
    ValidateError,
    getDefaultActionByCategory,
    getDefaultConditionValue,
    messageSystemActions,
    selectMessageSystemConfig,
    stripFieldFromMessage,
    validateMessageForm,
} from '@suite-common/message-system';
import { Action, Category } from '@suite-common/suite-types';
import { yup } from '@suite-common/validators';
import {
    Button,
    ButtonGroup,
    Card,
    Column,
    Icon,
    IconButton,
    Menu,
    Popover,
    PopoverRef,
    Row,
    Text,
    Textarea,
    Tooltip,
} from '@trezor/components';
import { useTextareaCursorPosition } from '@trezor/react-utils';
import { spacings, zIndices } from '@trezor/theme';

import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';

import { MessageSystemInfo } from './MessageSystemInfo';

const ScrollContainer = styled.div`
    overflow-y: auto;
    max-height: 90vh;
`;

const ErrorContainer = styled.div`
    max-height: 16rem;
    overflow-y: scroll;
`;

type PresetControlsProps = {
    categories: ReadonlyArray<{ value: Category; label: string }>;
    availableConditions: ReadonlyArray<{ value: string; label: string }>;
    canAddCondition: boolean;
    onPreset: (category: Category) => void;
    onAddCondition: (key: string) => void;
};
const PresetControls = ({
    categories,
    availableConditions,
    canAddCondition,
    onPreset,
    onAddCondition,
}: PresetControlsProps) => {
    const popoverRef = useRef<PopoverRef>(null);

    return (
        <Row alignItems="center" gap={spacings.xs}>
            <Text>Preset:</Text>
            <ButtonGroup variant="tertiary" size="small">
                {categories.map(c => (
                    <Button key={c.value} onClick={() => onPreset(c.value)}>
                        {c.label}
                    </Button>
                ))}
            </ButtonGroup>

            <Popover
                ref={popoverRef}
                zIndex={zIndices.tooltip}
                content={
                    <Menu
                        items={availableConditions.map(opt => ({
                            label: opt.label,
                            onClick: () => {
                                onAddCondition(opt.value);
                                popoverRef.current?.close();
                            },
                        }))}
                    />
                }
            >
                <Button size="small" icon="plus" variant="tertiary" isDisabled={!canAddCondition}>
                    Condition
                </Button>
            </Popover>
        </Row>
    );
};

const InfoButtons = () => (
    <Row gap={spacings.xs}>
        <Tooltip
            content={
                <div>
                    {Object.values(CONTEXT_PATTERNS).map(pattern => (
                        <div key={pattern.pattern}>{pattern.pattern}</div>
                    ))}
                </div>
            }
        >
            <Button size="small" icon="codeBlockFilled" variant="tertiary">
                Context patterns
            </Button>
        </Tooltip>

        <Tooltip
            content={
                <div>
                    {FEATURE_LIST.map(feature => (
                        <div key={feature}>{feature}</div>
                    ))}
                </div>
            }
        >
            <Button size="small" icon="checkFat" variant="tertiary">
                Feature list
            </Button>
        </Tooltip>

        <Popover
            content={
                <Card>
                    <ScrollContainer>
                        <MessageSystemInfo />
                    </ScrollContainer>
                </Card>
            }
            zIndex={zIndices.tooltip}
        >
            <IconButton icon="question" size="small" variant="tertiary" />
        </Popover>
    </Row>
);

type JsonEditorProps = {
    value: string;
    isValid: boolean;
    canFormat: boolean;
    errors: ValidateError[];
    onChange: (next: string) => void;
    onFormat: () => void;
};
const JsonEditor = ({ value, isValid, canFormat, errors, onChange, onFormat }: JsonEditorProps) => {
    const { textareaRef, position } = useTextareaCursorPosition();

    return (
        <Row gap={spacings.md} alignItems="flex-start">
            <Textarea
                innerRef={textareaRef}
                label="Message config"
                rows={10}
                value={value}
                inputState={isValid ? 'default' : 'error'}
                onChange={e => onChange(e.target.value)}
                bottomText={
                    <Row justifyContent="space-between" alignItems="center">
                        <Text>
                            Line {position.line}, Column {position.column}
                        </Text>
                        <Button
                            isDisabled={!canFormat}
                            size="tiny"
                            variant="tertiary"
                            onClick={onFormat}
                        >
                            Format JSON
                        </Button>
                    </Row>
                }
            />
            <Column width="50%">
                <Row gap={spacings.xs} margin={{ bottom: spacings.xs }}>
                    {isValid ? (
                        <>
                            <Icon name="checkCircleFilled" variant="primary" size="extraLarge" />
                            <span>Config is valid</span>
                        </>
                    ) : (
                        <>
                            <Icon name="xCircleFilled" variant="destructive" size="extraLarge" />
                            <span>Config is invalid</span>
                        </>
                    )}
                </Row>

                <ErrorContainer>
                    {!isValid && (
                        <Column gap={spacings.xxs}>
                            {errors.map((error, index) => (
                                <Text variant="destructive" key={index}>
                                    <strong>{error.field}</strong> {error.message}
                                </Text>
                            ))}
                        </Column>
                    )}
                </ErrorContainer>
            </Column>
        </Row>
    );
};

export const MessageSystemForm = () => {
    const defaultAction = JSON.stringify(getDefaultActionByCategory('banner'), null, 2);
    const config = useSelector(selectMessageSystemConfig);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<string>(defaultAction);
    const [parsedData, setParsedData] = useState<Action | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidateError[]>([]);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const isValid = validationErrors.length === 0;

    const messageIds = useMemo(
        () => new Set(config?.actions.map(action => action.message.id)),
        [config],
    );

    useEffect(() => {
        try {
            const parsed = JSON.parse(formData);
            setParsedData(parsed);

            const validatedData = validateMessageForm(parsed);

            if (messageIds.has(validatedData.message.id)) {
                setValidationErrors([
                    {
                        field: 'message.id',
                        message: `must be unique. “${validatedData.message.id}” is already in use.`,
                    },
                ]);
            } else {
                setValidationErrors([]);
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                const { message } = error;
                setParsedData(null);
                setValidationErrors([{ field: 'JSON', message }]);

                return;
            }

            if (error instanceof yup.ValidationError) {
                const errors = (error.inner?.length ? error.inner : [error]).map(e => ({
                    field: e.path ?? 'value',
                    message:
                        e.message === 'TR_REQUIRED_FIELD'
                            ? translationString(e.message)
                            : e.message,
                }));

                setValidationErrors(stripFieldFromMessage(errors));

                return;
            }

            setParsedData(null);
            setValidationErrors([{ field: 'JSON', message: 'Unknown error occurred' }]);
        }
    }, [formData, messageIds, translationString]);

    const formatJSON = useCallback(() => {
        setFormData(JSON.stringify(parsedData, null, 2));
    }, [parsedData]);

    const availableConditionOptions = useMemo(() => {
        if (!Array.isArray(parsedData?.conditions) || !parsedData.conditions[0]) {
            return CONDITION_OPTIONS;
        }

        const bucket = parsedData.conditions[0] as Record<string, unknown>;
        const used = new Set(Object.keys(bucket));

        return CONDITION_OPTIONS.filter(o => !used.has(o.value));
    }, [parsedData]);

    const handlePresetForm = useCallback((category: Category) => {
        setFormData(JSON.stringify(getDefaultActionByCategory(category), null, 2));
    }, []);

    const handleAddCondition = (conditionKey: string) => {
        if (!parsedData) return;

        const defaultValue = getDefaultConditionValue(conditionKey);

        const existing = Array.isArray(parsedData.conditions) ? parsedData.conditions : [];

        const head = (existing[0] ?? {}) as Record<string, unknown>;

        if (Object.prototype.hasOwnProperty.call(head, conditionKey)) {
            return;
        }

        const updatedHead = { ...head, [conditionKey]: defaultValue };

        const next = {
            ...parsedData,
            conditions: [updatedHead, ...existing.slice(1)],
        };

        setFormData(JSON.stringify(next, null, 2));
    };

    const handleAddMessage = () => {
        if (parsedData) {
            dispatch(messageSystemActions.addMessage(parsedData));
            setShowForm(false);
            setFormData(defaultAction);
        }
    };

    if (!showForm) {
        return (
            <Button size="small" onClick={() => setShowForm(true)}>
                Add new message
            </Button>
        );
    }

    return (
        <Column width="100%" gap={spacings.sm}>
            <Row justifyContent="space-between" alignItems="center">
                <PresetControls
                    categories={CATEGORY_OPTIONS}
                    availableConditions={availableConditionOptions}
                    canAddCondition={!!parsedData && availableConditionOptions.length > 0}
                    onPreset={handlePresetForm}
                    onAddCondition={handleAddCondition}
                />
                <InfoButtons />
            </Row>

            <JsonEditor
                value={formData}
                isValid={isValid}
                canFormat={parsedData !== null}
                errors={validationErrors}
                onChange={setFormData}
                onFormat={formatJSON}
            />

            <Row isReversed gap={spacings.xs}>
                <Button isDisabled={!isValid} onClick={handleAddMessage} size="small">
                    Add message
                </Button>
                <Button size="small" variant="tertiary" onClick={() => setShowForm(false)}>
                    Cancel
                </Button>
            </Row>
        </Column>
    );
};
