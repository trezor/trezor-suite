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
import { CopyButton } from './CopyButton';
import { defaultAttribute, platformOptions } from './constants';
import type { EventDoc } from '../../types';
import {
    type EventFormState,
    createEmptyFormState,
    eventDocToFormState,
    generateEventFileContent,
    getChangelogErrorMessage,
    getConstantsFilePath,
    getEnumAdditionSnippet,
    getEnumContextSnippet,
    getEventFilePath,
    getEventsIndexExportSnippet,
    getEventsIndexPath,
    getUsageExampleSnippet,
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
    const eventsIndexPath = getEventsIndexPath(formState.platform);
    const isEditing = !!initialEvent;
    const eventChangelogError = getChangelogErrorMessage(formState.changelog);
    const eventChangelogValid = !eventChangelogError;
    const attributesChangelogsValid = formState.attributes.every(
        a =>
            a.key.trim() === '' ||
            (a.changelog.length > 0 &&
                a.changelog.some(e => isValidAppVersion(e.version) && e.notes.trim() !== '')),
    );
    const allChangelogsValid = eventChangelogValid && attributesChangelogsValid;
    const eventNameTrimmed = formState.eventName.trim();
    const eventNameValidationError = eventNameTrimmed
        ? validateAnalyticsEventName(eventNameTrimmed)
        : null;
    const eventNameValid = !eventNameTrimmed || !eventNameValidationError;
    const generatedCode = eventNameTrimmed ? generateEventFileContent(formState) : '';
    const enumSnippet = eventNameTrimmed ? getEnumAdditionSnippet(eventNameTrimmed) : '';
    const enumContextSnippet = eventNameTrimmed ? getEnumContextSnippet(eventNameTrimmed) : '';
    const eventsIndexExportSnippet = eventNameTrimmed
        ? getEventsIndexExportSnippet(eventNameTrimmed)
        : '';
    const usageExampleSnippet =
        eventNameTrimmed && formState.platform
            ? getUsageExampleSnippet(formState.platform, eventNameTrimmed)
            : '';

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

    const modalContent = (
        <Modal.Backdrop zIndex={100} onClick={undefined} alignment={{ x: 'center', y: 'center' }}>
            <Modal.ModalBase
                heading={`${initialEvent === null ? 'Add' : 'Edit'} analytics event`}
                onCancel={onClose}
                onBackClick={showResult ? () => setShowResult(false) : undefined}
                width={760}
                bottomContent={
                    !showResult ? (
                        <Modal.Button
                            onClick={handleGenerate}
                            isDisabled={
                                !formState.eventName.trim() ||
                                !eventNameValid ||
                                !formState.descriptionTrigger.trim() ||
                                !allChangelogsValid
                            }
                        >
                            Generate file content
                        </Modal.Button>
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
                                        "Event has to be in form 'domain/event' (Example: settings/app-log-exported)."}
                                    {eventNameValidationError.messageId === 'invalidDomain' &&
                                        `Invalid domain '${eventNameValidationError.data?.domain}'. Use one of these: ${ANALYTICS_ALLOWED_DOMAINS.join(', ')}.`}
                                    {eventNameValidationError.messageId === 'notKebabCase' &&
                                        'Name must be in kebab-case (example: app-log-exported).'}
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
                                    placeholder="Example: User confirms THP connection"
                                    rows={2}
                                />
                            </Column>

                            <Column gap={8}>
                                <Row gap={8}>
                                    <Text>Attributes</Text>
                                    <Badge intent="info">{formState.attributes.length}</Badge>
                                </Row>
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
                        </>
                    ) : (
                        <Column gap={16}>
                            {/* 1. Add to EventType enum */}
                            {!isEditing && (
                                <Card paddingType="normal">
                                    <Column gap={8}>
                                        <Text typographyStyle="body-md">
                                            1. Add to EventType enum
                                        </Text>
                                        <Text typographyStyle="body-sm">
                                            In <Text isMonospaced>{constantsFilePath}</Text>, add
                                            your entry inside the enum, e.g.:
                                        </Text>
                                        <Row justifyContent="flex-end">
                                            <CopyButton
                                                textToCopy={enumSnippet}
                                                copyLabel="Copy enum line"
                                            />
                                        </Row>
                                        <Card paddingType="normal">
                                            <div
                                                style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: 13,
                                                    whiteSpace: 'pre',
                                                }}
                                            >
                                                {enumContextSnippet}
                                            </div>
                                        </Card>
                                    </Column>
                                </Card>
                            )}

                            {/* 2. Create new file */}
                            <Card paddingType="normal">
                                <Column gap={8}>
                                    <Text typographyStyle="body-md">
                                        {isEditing ? 'File path' : '2. Create new file'}
                                    </Text>
                                    <Row alignItems="center" justifyContent="space-between" gap={8}>
                                        <Text isMonospaced typographyStyle="body-md-strong">
                                            {filePath}
                                        </Text>
                                        <CopyButton textToCopy={filePath} copyLabel="Copy path" />
                                    </Row>
                                    {isEditing && (
                                        <Text typographyStyle="body-sm">
                                            Replace the existing file with the generated content
                                            below.
                                        </Text>
                                    )}
                                </Column>
                            </Card>

                            {/* 3. Generated file content */}
                            <Card paddingType="normal">
                                <Column gap={8}>
                                    <Text typographyStyle="body-md">
                                        {isEditing
                                            ? 'Generated file content'
                                            : '3. Put this content in the file'}
                                    </Text>
                                    <Row justifyContent="flex-end" alignItems="center">
                                        <CopyButton
                                            textToCopy={generatedCode}
                                            copyLabel="Copy code"
                                        />
                                    </Row>
                                    <Card paddingType="normal">
                                        <div
                                            style={{
                                                overflow: 'auto',
                                                maxHeight: 360,
                                                whiteSpace: 'pre',
                                            }}
                                        >
                                            <Paragraph isMonospaced typographyStyle="body-xs">
                                                {generatedCode}
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Column>
                            </Card>

                            {/* 4. Add to index */}
                            {!isEditing && eventsIndexExportSnippet && (
                                <Card paddingType="normal">
                                    <Column gap={8}>
                                        <Text typographyStyle="body-md">4. Add to index</Text>
                                        <Text typographyStyle="body-sm">
                                            In <Text isMonospaced>{eventsIndexPath}</Text>, add:
                                        </Text>
                                        <Row justifyContent="flex-end">
                                            <CopyButton
                                                textToCopy={eventsIndexExportSnippet}
                                                copyLabel="Copy export line"
                                            />
                                        </Row>
                                        <Card paddingType="normal">
                                            <Text isMonospaced typographyStyle="body-xs">
                                                {eventsIndexExportSnippet}
                                            </Text>
                                        </Card>
                                    </Column>
                                </Card>
                            )}

                            {/* 5. Ready to use */}
                            {!isEditing && usageExampleSnippet && (
                                <Card paddingType="normal">
                                    <Column gap={8}>
                                        <Text typographyStyle="body-md">5. Ready to use</Text>
                                        <Text typographyStyle="body-sm">
                                            Example with <Text isMonospaced>analytics.report</Text>,{' '}
                                            <Text isMonospaced>useAnalytics</Text> and imports:
                                        </Text>
                                        <Row justifyContent="flex-end">
                                            <CopyButton
                                                textToCopy={usageExampleSnippet}
                                                copyLabel="Copy example"
                                            />
                                        </Row>
                                        <Card paddingType="normal">
                                            <div
                                                style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: 13,
                                                    overflow: 'auto',
                                                    whiteSpace: 'pre',
                                                }}
                                            >
                                                <Text isMonospaced typographyStyle="body-xs">
                                                    {usageExampleSnippet}
                                                </Text>
                                            </div>
                                        </Card>
                                    </Column>
                                </Card>
                            )}
                        </Column>
                    )}
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );

    if (!isOpen) return null;

    return createPortal(modalContent, document.body);
};
