import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
    Banner,
    Button,
    Card,
    Collapsible,
    Column,
    H4,
    Input,
    Modal,
    Paragraph,
    Row,
    Select,
    Text,
    Textarea,
} from '@trezor/components';

import { AttributeEditor } from './AttributeEditor';
import { ChangelogEntriesEditor } from './ChangelogEntriesEditor';
import { defaultAttribute, isValidAttributeType, platformOptions } from './constants';
import type { EventDoc } from '../../types';
import {
    type EventFormState,
    createEmptyFormState,
    eventDocToFormState,
    generateEventFileContent,
    getChangelogErrorMessage,
    getConstantsFilePath,
    getEnumAdditionSnippet,
    getEventFilePath,
    isValidAppVersion,
} from '../../utils/eventFileUtils';

type AddEventModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** When set, form is pre-filled with this event (e.g. from EventCard Edit). */
    initialEvent?: EventDoc | null;
};

export const AddEventModal = ({ isOpen, onClose, initialEvent }: AddEventModalProps) => {
    const [formState, setFormState] = useState<EventFormState>(createEmptyFormState);
    const [showResult, setShowResult] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (initialEvent) {
            setFormState(eventDocToFormState(initialEvent));
        } else {
            setFormState(createEmptyFormState());
        }
        setShowResult(false);
    }, [isOpen, initialEvent]);

    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    const handleGenerate = useCallback(() => {
        setShowResult(true);
    }, []);

    const filePath = formState.eventName.trim()
        ? getEventFilePath(formState.platform, formState.eventName.trim())
        : '';
    const constantsFilePath = getConstantsFilePath(formState.platform);
    const isEditing = !!initialEvent;
    const eventChangelogError = getChangelogErrorMessage(formState.changelog);
    const eventChangelogValid = !eventChangelogError;
    const attributesChangelogsValid = formState.attributes.every(
        a =>
            a.key.trim() === '' ||
            (a.changelog.length > 0 &&
                a.changelog.some(e => isValidAppVersion(e.version) && e.notes.trim() !== '')),
    );
    const attributesTypesValid = formState.attributes.every(
        a => a.key.trim() === '' || isValidAttributeType(a.runtimeType),
    );
    const allChangelogsValid = eventChangelogValid && attributesChangelogsValid;
    const generatedCode = formState.eventName.trim() ? generateEventFileContent(formState) : '';
    const enumSnippet = formState.eventName.trim()
        ? getEnumAdditionSnippet(formState.eventName.trim())
        : '';

    const handleCopyCode = useCallback(async () => {
        if (!generatedCode) return;
        await navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [generatedCode]);

    const modalContent = (
        <Modal.Backdrop zIndex={100} onClick={undefined} alignment={{ x: 'center', y: 'center' }}>
            <Modal.ModalBase
                heading="Add or edit analytics event"
                description="Fill in the event details. You can load an existing event to edit it."
                onCancel={onClose}
                onBackClick={showResult ? () => setShowResult(false) : undefined}
                width={760}
                bottomContent={
                    !showResult ? (
                        <Button
                            onClick={handleGenerate}
                            isDisabled={
                                !formState.eventName.trim() ||
                                !formState.descriptionTrigger.trim() ||
                                !allChangelogsValid ||
                                !attributesTypesValid
                            }
                        >
                            Generate file content
                        </Button>
                    ) : null
                }
            >
                <Column gap={24}>
                    {!showResult ? (
                        <>
                            <Row gap={16} alignItems="flex-start">
                                <Input
                                    size="small"
                                    labelLeft="Event name"
                                    value={formState.eventName}
                                    onChange={e =>
                                        setFormState(s => ({ ...s, eventName: e.target.value }))
                                    }
                                    placeholder="např. connect-popup/init nebo coin_discovery"
                                />
                                <Select
                                    size="small"
                                    labelLeft="Platform"
                                    options={platformOptions}
                                    value={
                                        platformOptions.find(p => p.value === formState.platform) ??
                                        platformOptions[0]
                                    }
                                    onChange={opt =>
                                        opt && setFormState(s => ({ ...s, platform: opt.value }))
                                    }
                                    menuPortalTarget={document.body}
                                    menuPortalZIndex={101}
                                />
                            </Row>
                            <Column gap={8}>
                                <Textarea
                                    labelLeft="Trigger (kdy se event odešle?)"
                                    value={formState.descriptionTrigger}
                                    onChange={e =>
                                        setFormState(s => ({
                                            ...s,
                                            descriptionTrigger: e.target.value,
                                        }))
                                    }
                                    placeholder="např. User confirms THP connection"
                                    rows={2}
                                />
                            </Column>
                            <Collapsible defaultIsOpen={false}>
                                <Collapsible.Toggle>
                                    <Text typographyStyle="label">Zobrazit další</Text>
                                </Collapsible.Toggle>
                                <Collapsible.Content>
                                    <Column gap={8}>
                                        <Textarea
                                            labelLeft="Description (volitelné)"
                                            value={formState.description}
                                            onChange={e =>
                                                setFormState(s => ({
                                                    ...s,
                                                    description: e.target.value,
                                                }))
                                            }
                                            placeholder="Další popis"
                                            rows={2}
                                        />
                                        <Textarea
                                            labelLeft="Possible improvements (volitelné)"
                                            value={formState.possibleImprovements}
                                            onChange={e =>
                                                setFormState(s => ({
                                                    ...s,
                                                    possibleImprovements: e.target.value,
                                                }))
                                            }
                                            placeholder="Budoucí vylepšení nebo poznámky"
                                            rows={2}
                                        />
                                    </Column>
                                </Collapsible.Content>
                            </Collapsible>
                            <ChangelogEntriesEditor
                                label="Event changelog"
                                entries={formState.changelog}
                                onChange={changelog => setFormState(s => ({ ...s, changelog }))}
                                errorType={eventChangelogError ?? undefined}
                            />
                            <Column gap={8}>
                                <H4>Attributes</H4>
                                {formState.attributes.length === 0 && (
                                    <Text typographyStyle="hint">
                                        Event can have no attributes (e.g. accounts/active-staking).
                                    </Text>
                                )}
                                {formState.attributes.map((attr, idx) => (
                                    <AttributeEditor
                                        key={idx}
                                        attr={attr}
                                        onChange={a => {
                                            const next = [...formState.attributes];
                                            next[idx] = a;
                                            setFormState(s => ({ ...s, attributes: next }));
                                        }}
                                        onRemove={() =>
                                            setFormState(s => ({
                                                ...s,
                                                attributes: s.attributes.filter(
                                                    (_, i) => i !== idx,
                                                ),
                                            }))
                                        }
                                        canRemove
                                    />
                                ))}
                                <Button
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    iconLeft="plus"
                                    onClick={() =>
                                        setFormState(s => ({
                                            ...s,
                                            attributes: [...s.attributes, defaultAttribute()],
                                        }))
                                    }
                                >
                                    Add attribute
                                </Button>
                            </Column>
                        </>
                    ) : (
                        <Column gap={16}>
                            <H4>Where to put the file</H4>
                            <Card paddingType="normal">
                                <Column gap={8}>
                                    <Text typographyStyle="label">File path (from repo root)</Text>
                                    <Row alignItems="center" gap={8}>
                                        <Text isMonospaced typographyStyle="highlight">
                                            {filePath}
                                        </Text>
                                        <Button
                                            size="small"
                                            intent="neutral"
                                            priority="secondary"
                                            iconLeft="copy"
                                            onClick={async () => {
                                                if (filePath) {
                                                    await navigator.clipboard.writeText(filePath);
                                                }
                                            }}
                                        >
                                            Copy path
                                        </Button>
                                    </Row>
                                    {isEditing ? (
                                        <Text typographyStyle="hint">
                                            Replace the existing file at this path with the
                                            generated content below.
                                        </Text>
                                    ) : (
                                        <Text typographyStyle="hint">
                                            Create a new file at this path. Add the event to the
                                            package&apos;s{' '}
                                            <Text isMonospaced>src/events/index.ts</Text> export
                                            list.
                                        </Text>
                                    )}
                                </Column>
                            </Card>

                            {!isEditing && (
                                <Card paddingType="normal">
                                    <Column gap={8}>
                                        <Text typographyStyle="label">Add to EventType enum</Text>
                                        <Text typographyStyle="hint">
                                            In <Text isMonospaced>{constantsFilePath}</Text>, add:
                                        </Text>
                                        <div
                                            style={{
                                                padding: 12,
                                                background:
                                                    'var(--color-backgroundSurfaceElevation1)',
                                                fontFamily: 'monospace',
                                                fontSize: 13,
                                                borderRadius: 12,
                                            }}
                                        >
                                            {enumSnippet}
                                        </div>
                                        <Button
                                            size="small"
                                            intent="neutral"
                                            priority="secondary"
                                            iconLeft="copy"
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(enumSnippet);
                                            }}
                                        >
                                            Copy enum line
                                        </Button>
                                    </Column>
                                </Card>
                            )}

                            <Card paddingType="normal">
                                <Column gap={8}>
                                    <Row justifyContent="space-between" alignItems="center">
                                        <Text typographyStyle="label">Generated file content</Text>
                                        <Button
                                            size="small"
                                            intent="neutral"
                                            priority="secondary"
                                            iconLeft={copied ? 'check' : 'copy'}
                                            onClick={handleCopyCode}
                                        >
                                            {copied ? 'Copied!' : 'Copy code'}
                                        </Button>
                                    </Row>
                                    <div
                                        style={{
                                            padding: 12,
                                            background: 'var(--color-backgroundSurfaceElevation1)',
                                            overflow: 'auto',
                                            maxHeight: 360,
                                            borderRadius: 12,
                                            whiteSpace: 'pre',
                                        }}
                                    >
                                        <Paragraph isMonospaced typographyStyle="label">
                                            {generatedCode}
                                        </Paragraph>
                                    </div>
                                </Column>
                            </Card>
                        </Column>
                    )}
                    <Banner
                        intent="info"
                        icon
                        description={
                            <>
                                You can also add or edit events manually. See the{' '}
                                <a
                                    href="https://github.com/trezor/trezor-suite/blob/develop/suite-common/analytics/README.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    analytics README
                                </a>{' '}
                                for the step-by-step guide.
                            </>
                        }
                    />
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );

    if (!isOpen) return null;

    return createPortal(modalContent, document.body);
};
