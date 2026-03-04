import { ANALYTICS_ALLOWED_DOMAINS, validateAnalyticsEventName } from '@suite-common/analytics';
import {
    Badge,
    Banner,
    Button,
    CollapsibleBox,
    Column,
    Input,
    Link,
    Paragraph,
    Row,
    Select,
    Text,
    Textarea,
} from '@trezor/components';

import { AttributeEditor } from './AttributeEditor';
import { ChangelogEntriesEditor } from './ChangelogEntriesEditor';
import { defaultAttribute, platformOptions } from './constants';
import type { EventFormState } from '../../utils/eventFileUtils';

type EventFormProps = {
    formState: EventFormState;
    setFormState: React.Dispatch<React.SetStateAction<EventFormState>>;
    eventChangelogError: ReturnType<
        typeof import('../../utils/eventFileUtils').getChangelogErrorMessage
    > | null;
};

const domainOptions = ANALYTICS_ALLOWED_DOMAINS.map(d => ({ value: d, label: d }));

export const EventForm = ({ formState, setFormState, eventChangelogError }: EventFormProps) => {
    const domainFromEventName = formState.eventName.includes('/')
        ? formState.eventName.split('/')[0]
        : formState.eventName.trim();
    const eventPartFromEventName = (() => {
        if (formState.eventName.includes('/')) {
            return formState.eventName.split('/').slice(1).join('/');
        }
        const trimmed = formState.eventName.trim();

        return (ANALYTICS_ALLOWED_DOMAINS as readonly string[]).includes(trimmed)
            ? ''
            : formState.eventName;
    })();
    const domainSelectValue =
        domainFromEventName &&
        (ANALYTICS_ALLOWED_DOMAINS as readonly string[]).includes(domainFromEventName)
            ? (domainOptions.find(o => o.value === domainFromEventName) ?? domainOptions[0])
            : domainOptions[0];
    const eventNameTrimmed = formState.eventName.trim();
    const eventNameValidationError = eventNameTrimmed
        ? validateAnalyticsEventName(eventNameTrimmed)
        : null;

    return (
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
                    onChange={opt => opt && setFormState(s => ({ ...s, platform: opt.value }))}
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
                                (eventPartFromEventName ? `/${eventPartFromEventName}` : ''),
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
                            (ANALYTICS_ALLOWED_DOMAINS as readonly string[]).includes(
                                domainFromEventName,
                            )
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
                                attributes: s.attributes.filter((_, i) => i !== idx),
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
    );
};
