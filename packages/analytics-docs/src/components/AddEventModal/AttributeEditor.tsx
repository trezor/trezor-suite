import {
    Button,
    Card,
    Checkbox,
    CollapsibleBox,
    Column,
    Icon,
    Input,
    Paragraph,
    Row,
    Text,
    Textarea,
    Tooltip,
} from '@trezor/components';
import { zIndices } from '@trezor/theme';

import {
    AttributeKeyTypePreview,
    AttributeTypeReferenceTooltipContent,
} from './AttributeTypeReference';
import { ChangelogEntriesEditor } from './ChangelogEntriesEditor';
import type { EventFormAttribute } from '../../utils/eventFileUtils';
import { getChangelogErrorMessage } from '../../utils/eventFileUtils';

export const AttributeEditor = ({
    attr,
    onChange,
    onRemove,
    canRemove,
}: {
    attr: EventFormAttribute;
    onChange: (a: EventFormAttribute) => void;
    onRemove: () => void;
    canRemove: boolean;
}) => (
    <CollapsibleBox
        heading={
            <Row justifyContent="space-between" gap={8} alignItems="center">
                <Row gap={8}>
                    {(attr.key.trim() !== '' || attr.runtimeType.trim() !== '') && (
                        <AttributeKeyTypePreview
                            keyName={attr.key.trim() || 'key'}
                            isOptional={attr.isOptional}
                            typeStr={attr.runtimeType.trim() || 'string'}
                        />
                    )}
                </Row>
            </Row>
        }
        paddingType="small"
    >
        <Card paddingType="small">
            <Column gap={8}>
                <Row gap={12}>
                    <Paragraph typographyStyle="body-xs" width={200}>
                        Name *
                    </Paragraph>
                    <Row gap={4} alignItems="center">
                        <Text typographyStyle="body-xs">Type *</Text>
                        <Tooltip
                            content={<AttributeTypeReferenceTooltipContent />}
                            placement="top"
                            tooltipMaxWidth={360}
                            appendTo={document.body}
                            zIndex={zIndices.windowControls}
                        >
                            <Icon name="question" size={16} priority="secondary" cursor="help" />
                        </Tooltip>
                    </Row>
                </Row>
                <Row gap={12} alignItems="center" flexWrap="nowrap">
                    <Input
                        size="small"
                        value={attr.key}
                        onChange={e => onChange({ ...attr, key: e.target.value })}
                        placeholder="Example: networkName"
                        width={200}
                    />
                    <Column gap={8}>
                        <Input
                            size="small"
                            value={attr.runtimeType}
                            onChange={e => onChange({ ...attr, runtimeType: e.target.value })}
                            placeholder="string, number, 'a' | 'b', string[]"
                        />
                    </Column>

                    <Checkbox
                        isChecked={attr.isOptional}
                        onClick={() => onChange({ ...attr, isOptional: !attr.isOptional })}
                    >
                        optional
                    </Checkbox>
                </Row>

                <CollapsibleBox
                    heading="Attribute changelog *"
                    paddingType="small"
                    margin={{ top: 16 }}
                >
                    <ChangelogEntriesEditor
                        entries={attr.changelog}
                        onChange={changelog => onChange({ ...attr, changelog })}
                        errorType={
                            attr.key.trim() !== ''
                                ? (getChangelogErrorMessage(attr.changelog) ?? undefined)
                                : undefined
                        }
                    />
                </CollapsibleBox>
                <CollapsibleBox heading="Description" paddingType="small">
                    <Textarea
                        value={attr.description}
                        onChange={e => onChange({ ...attr, description: e.target.value })}
                        placeholder="Popis atributu"
                        rows={2}
                    />
                </CollapsibleBox>
                {canRemove && (
                    <Button
                        iconLeft="trash"
                        size="small"
                        intent="critical"
                        priority="secondary"
                        onClick={onRemove}
                        aria-label="Remove"
                    >
                        Delete attribute
                    </Button>
                )}
            </Column>
        </Card>
    </CollapsibleBox>
);
