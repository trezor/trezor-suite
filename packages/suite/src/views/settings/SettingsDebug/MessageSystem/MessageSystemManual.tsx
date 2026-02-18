import { Badge, H3, Icon, Table, Tooltip } from '@trezor/components';

const FIELDS = {
    message: [
        {
            field: 'id',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'Unique identifier of the message (e.g. UUID)',
            allowed: 'string (e.g. "6f92b4ec-7dc4-4b57-a7fb-b2e4c4e97920")',
        },
        {
            field: 'priority',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'Message display priority, higher = more important',
            allowed: 'integer (0–100)',
        },
        {
            field: 'dismissible',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'Whether user can close the message',
            allowed: 'true / false',
        },
        {
            field: 'variant',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'Severity level of the message',
            allowed: (
                <>
                    <Badge intent="info">info</Badge> <Badge intent="warning">warning</Badge>{' '}
                    <Badge intent="critical">critical</Badge>
                </>
            ),
        },
        {
            field: 'category',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'Where the message will appear',
            allowed: (
                <>
                    <Badge intent="neutral">banner</Badge>
                    <Badge intent="neutral">context</Badge>
                    <Badge intent="neutral">modal</Badge>
                    <Badge intent="neutral">feature</Badge>
                </>
            ),
        },
        {
            field: 'content',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'Main body text of the message (localized)',
            allowed: 'object with keys: en, cs, de, es, fr, pt',
        },
        {
            field: 'headline',
            required: <Icon name="xCircleFilled" intent="critical" />,
            description: 'Headline shown above the content',
            allowed: 'same as content (localization object)',
        },
        {
            field: 'cta',
            required: (
                <Tooltip content="only for banner and context">
                    <Icon name="checkCircleFilled" intent="warning" />
                </Tooltip>
            ),
            description: 'Call-to-action config',
            allowed: '{ action, link, label }',
        },
        {
            field: 'modal',
            required: (
                <Tooltip content="only for modal">
                    <Icon name="checkCircleFilled" intent="warning" />
                </Tooltip>
            ),
            description: 'Modal-specific configuration',
            allowed: '{ title: localization, image: string }',
        },
        {
            field: 'feature',
            required: (
                <Tooltip content="only for feature">
                    <Icon name="checkCircleFilled" intent="warning" />
                </Tooltip>
            ),
            description: 'Feature flag configuration',
            allowed: 'Array of { domain: string, flag: boolean }',
        },
        {
            field: 'context',
            required: (
                <Tooltip content="only for context">
                    <Icon name="checkCircleFilled" intent="warning" />
                </Tooltip>
            ),
            description: 'Context in which message is shown',
            allowed: '{ domain: string | string[] }',
        },
    ],
    experimental: [
        {
            field: 'id',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'Unique identifier of the experiment',
            allowed: 'string (e.g. "6f92b4ec-7dc4-4b57-a7fb-b2e4c4e97920")',
        },
        {
            field: 'groups',
            required: <Icon name="checkCircleFilled" intent="brand" />,
            description: 'List of variant buckets with traffic allocation',
            allowed:
                'Array of { variant: string, percentage: integer (0–100) } (sum across all groups must be 100)',
        },
    ],
    conditions: [
        {
            field: 'duration',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Time range when the message is valid',
            allowed: '{ from: ISO8601, to: ISO8601 }',
        },
        {
            field: 'os',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Operating systems and versions',
            allowed: '{ windows: "*", linux: "*", ... }',
        },
        {
            field: 'environment',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Suite platform and revision',
            allowed: '{ desktop: "*", mobile: "*", web: "*" }',
        },
        {
            field: 'browser',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Target specific browsers',
            allowed: '{ chrome: "*", firefox: "*", ... }',
        },
        {
            field: 'transport',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Bridge or WebUSB availability',
            allowed: '{ bridge: "*", webusbplugin: "*" }',
        },
        {
            field: 'settings',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Suite settings (e.g., tor, enabled coins)',
            allowed: '[{ tor: true }]',
        },
        {
            field: 'devices',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Trezor hardware model & firmware version',
            allowed: '[{ model: "T", firmware: "*", vendor: "*" }]',
        },
        {
            field: 'countryCodes',
            required: <Icon name="checkCircleFilled" intent="warning" />,
            description: 'Target specific countries',
            allowed: '["US", "CZ", ...] (ISO 3166-1 alpha-2)',
        },
    ],
};

const SECTIONS = [
    { title: 'Message fields', key: 'message' },
    { title: 'Experimental fields', key: 'experimental' },
    { title: 'Condition fields', key: 'conditions' },
] as const;

type MessageSystemManualProps = {
    include?: ReadonlyArray<(typeof SECTIONS)[number]['key']>;
};

export const MessageSystemManual = ({ include }: MessageSystemManualProps) => {
    const visibleSections = include
        ? SECTIONS.filter(section => include?.includes(section.key))
        : SECTIONS;

    return (
        <Table hasBorders>
            <Table.Header>
                <Table.Row>
                    <Table.Cell>
                        <strong>Field</strong>
                    </Table.Cell>
                    <Table.Cell>
                        <strong>Required</strong>
                    </Table.Cell>
                    <Table.Cell>
                        <strong>Description</strong>
                    </Table.Cell>
                    <Table.Cell>
                        <strong>Allowed values</strong>
                    </Table.Cell>
                </Table.Row>
            </Table.Header>

            {visibleSections.map(section => (
                <Table.Body key={section.key}>
                    <Table.Row>
                        <Table.Cell colSpan={4}>
                            <H3>{section.title}</H3>
                        </Table.Cell>
                    </Table.Row>
                    {FIELDS[section.key].map((row, i) => (
                        <Table.Row key={i}>
                            <Table.Cell>{row.field}</Table.Cell>
                            <Table.Cell>{row.required}</Table.Cell>
                            <Table.Cell>{row.description}</Table.Cell>
                            <Table.Cell>{row.allowed}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            ))}
        </Table>
    );
};
