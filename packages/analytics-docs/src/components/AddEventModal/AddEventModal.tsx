import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ANALYTICS_ALLOWED_DOMAINS, validateAnalyticsEventName } from '@suite-common/analytics';
import {
    Badge,
    Banner,
    Button,
    Card,
    CollapsibleBox,
    Column,
    H4,
    Input,
    Link,
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
    const eventNameTrimmed = formState.eventName.trim();
    const eventNameValidationError = eventNameTrimmed
        ? validateAnalyticsEventName(eventNameTrimmed)
        : null;
    const eventNameValid = !eventNameTrimmed || !eventNameValidationError;
    const generatedCode = eventNameTrimmed ? generateEventFileContent(formState) : '';
    const enumSnippet = eventNameTrimmed ? getEnumAdditionSnippet(eventNameTrimmed) : '';

    const domainFromEventName = formState.eventName.includes('/')
        ? formState.eventName.split('/')[0]
        : formState.eventName.trim();
    const eventPartFromEventName = formState.eventName.includes('/')
        ? formState.eventName.split('/').slice(1).join('/')
        : '';
    const domainOptions = ANALYTICS_ALLOWED_DOMAINS.map(d => ({ value: d, label: d }));
    const domainSelectValue =
        domainFromEventName &&
        (ANALYTICS_ALLOWED_DOMAINS as readonly string[]).includes(domainFromEventName)
            ? (domainOptions.find(o => o.value === domainFromEventName) ?? domainOptions[0])
            : domainOptions[0];

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
                                !eventNameValid ||
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
                                <Select
                                    size="small"
                                    labelLeft="Platform *"
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
                                    flex="1"
                                />
                                <Select
                                    size="small"
                                    labelLeft="Domain *"
                                    options={domainOptions}
                                    value={domainSelectValue}
                                    onChange={opt =>
                                        opt &&
                                        setFormState(s => ({
                                            ...s,
                                            eventName:
                                                opt.value +
                                                (eventPartFromEventName
                                                    ? `/${eventPartFromEventName}`
                                                    : ''),
                                        }))
                                    }
                                    menuPortalTarget={document.body}
                                    menuPortalZIndex={101}
                                    flex="1"
                                />
                                <Input
                                    size="small"
                                    labelLeft="Event name *"
                                    value={eventPartFromEventName}
                                    onChange={e => {
                                        const newPart = e.target.value;
                                        const domain =
                                            domainFromEventName &&
                                            (
                                                ANALYTICS_ALLOWED_DOMAINS as readonly string[]
                                            ).includes(domainFromEventName)
                                                ? domainFromEventName
                                                : ANALYTICS_ALLOWED_DOMAINS[0];
                                        setFormState(s => ({
                                            ...s,
                                            eventName: newPart ? `${domain}/${newPart}` : domain,
                                        }));
                                    }}
                                    placeholder="Example: `tokens-status` (kebab-case)"
                                />
                            </Row>
                            {eventNameValidationError && eventNameTrimmed && (
                                <Text typographyStyle="body-sm" color="textAlertRed">
                                    {eventNameValidationError.messageId === 'invalidFormat' &&
                                        "Event musí být ve tvaru 'domain/event' (např. settings/app-log-exported)."}
                                    {eventNameValidationError.messageId === 'invalidDomain' &&
                                        `Neplatná doména '${eventNameValidationError.data?.domain}'. Použij jednu z: ${ANALYTICS_ALLOWED_DOMAINS.join(', ')}.`}
                                    {eventNameValidationError.messageId === 'notKebabCase' &&
                                        'Část za lomítkem musí být kebab-case (např. app-log-exported).'}
                                </Text>
                            )}
                            <Column gap={8}>
                                <Textarea
                                    labelLeft="Trigger description *"
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

                            <CollapsibleBox
                                heading={
                                    <Row gap={4}>
                                        <Text>Attributes</Text>
                                        <Badge intent="info">{formState.attributes.length}</Badge>
                                    </Row>
                                }
                                paddingType="small"
                            >
                                <Column gap={8}>
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
                                        margin={{ top: 8 }}
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
                            </CollapsibleBox>

                            <CollapsibleBox heading="Event changelog *" paddingType="small">
                                <ChangelogEntriesEditor
                                    entries={formState.changelog}
                                    onChange={changelog => setFormState(s => ({ ...s, changelog }))}
                                    errorType={eventChangelogError ?? undefined}
                                />
                            </CollapsibleBox>

                            <CollapsibleBox heading="Other fields" paddingType="small">
                                <Column gap={8}>
                                    <Textarea
                                        labelLeft="Description"
                                        value={formState.description}
                                        onChange={e =>
                                            setFormState(s => ({
                                                ...s,
                                                description: e.target.value,
                                            }))
                                        }
                                        rows={2}
                                    />
                                    <Textarea
                                        labelLeft="Possible improvements"
                                        value={formState.possibleImprovements}
                                        onChange={e =>
                                            setFormState(s => ({
                                                ...s,
                                                possibleImprovements: e.target.value,
                                            }))
                                        }
                                        rows={2}
                                    />
                                </Column>
                            </CollapsibleBox>
                        </>
                    ) : (
                        <Column gap={16}>
                            <H4>Where to put the file</H4>
                            <Card paddingType="normal">
                                <Column gap={8}>
                                    <Text typographyStyle="body-xs">
                                        File path (from repo root)
                                    </Text>
                                    <Row alignItems="center" gap={8}>
                                        <Text isMonospaced typographyStyle="body-md-strong">
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
                                        <Text typographyStyle="body-sm">
                                            Replace the existing file at this path with the
                                            generated content below.
                                        </Text>
                                    ) : (
                                        <Text typographyStyle="body-sm">
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
                                        <Text typographyStyle="body-md">Add to EventType enum</Text>
                                        <Text typographyStyle="body-sm">
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
                                        <Text typographyStyle="body-xs">
                                            Generated file content
                                        </Text>
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
                                        <Paragraph isMonospaced typographyStyle="body-xs">
                                            {generatedCode}
                                        </Paragraph>
                                    </div>
                                </Column>
                            </Card>
                        </Column>
                    )}
                    <Paragraph typographyStyle="body-sm">* mandatory fields</Paragraph>
                    <Banner
                        intent="info"
                        icon
                        description={
                            <>
                                You can also add or edit events manually. See the{' '}
                                <Link
                                    href="https://github.com/trezor/trezor-suite/blob/develop/suite-common/analytics/README.md"
                                    target="_blank"
                                >
                                    analytics README
                                </Link>{' '}
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
