import {
    Card,
    Checkbox,
    Collapsible,
    Column,
    Icon,
    IconButton,
    Input,
    Row,
    Text,
    Textarea,
    Tooltip,
} from '@trezor/components';

import {
    AttributeKeyTypePreview,
    AttributeTypeReferenceTooltipContent,
} from './AttributeTypeReference';
import { ChangelogEntriesEditor } from './ChangelogEntriesEditor';
import { isValidAttributeType } from './constants';
import { getChangelogErrorMessage } from '../../utils/eventFileUtils';
import type { EventFormAttribute } from '../../utils/eventFileUtils';

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
    <Card paddingType="small">
        <Column gap={8}>
            <Row justifyContent="space-between" alignItems="center">
                <Text typographyStyle="label">Attribute</Text>
                {canRemove && (
                    <IconButton
                        icon="trash"
                        size="small"
                        intent="neutral"
                        onClick={onRemove}
                        aria-label="Remove"
                    />
                )}
            </Row>
            <Row gap={12} alignItems="flex-start" flexWrap="nowrap">
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <Input
                        size="small"
                        labelLeft="Attribute key"
                        value={attr.key}
                        onChange={e => onChange({ ...attr, key: e.target.value })}
                        placeholder="např. discoveryId"
                    />
                </div>
                <div style={{ flex: '0 0 auto', alignSelf: 'center' }}>
                    <Checkbox
                        isChecked={attr.isOptional}
                        onClick={() => onChange({ ...attr, isOptional: !attr.isOptional })}
                    >
                        Is optional
                    </Checkbox>
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <Column gap={4}>
                        <Row gap={4} alignItems="center">
                            <Text typographyStyle="label">Type</Text>
                            <Tooltip
                                content={<AttributeTypeReferenceTooltipContent />}
                                placement="top"
                                tooltipMaxWidth={360}
                                appendTo={document.body}
                                zIndex={110}
                            >
                                <Icon name="question" size="small" />
                            </Tooltip>
                        </Row>
                        <Input
                            size="small"
                            value={attr.runtimeType}
                            onChange={e => onChange({ ...attr, runtimeType: e.target.value })}
                            placeholder="string, number, 'a' | 'b', string[]"
                            hasError={
                                attr.runtimeType.trim() !== '' &&
                                !isValidAttributeType(attr.runtimeType)
                            }
                        />
                        {(attr.key.trim() !== '' || attr.runtimeType.trim() !== '') && (
                            <AttributeKeyTypePreview
                                keyName={attr.key.trim() || 'key'}
                                isOptional={attr.isOptional}
                                typeStr={attr.runtimeType.trim() || 'string'}
                            />
                        )}
                    </Column>
                </div>
            </Row>
            <Collapsible defaultIsOpen={false}>
                <Collapsible.Toggle>
                    <Text typographyStyle="label">Popis atributu (volitelné)</Text>
                </Collapsible.Toggle>
                <Collapsible.Content>
                    <Textarea
                        labelLeft="Description"
                        value={attr.description}
                        onChange={e => onChange({ ...attr, description: e.target.value })}
                        placeholder="Popis atributu"
                        rows={2}
                    />
                </Collapsible.Content>
            </Collapsible>
            <ChangelogEntriesEditor
                label="Attribute changelog"
                entries={attr.changelog}
                onChange={changelog => onChange({ ...attr, changelog })}
                errorType={
                    attr.key.trim() !== ''
                        ? (getChangelogErrorMessage(attr.changelog) ?? undefined)
                        : undefined
                }
            />
        </Column>
    </Card>
);
