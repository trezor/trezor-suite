import { platforms as platformsFromConstants } from '../../constants';
import type { EventFormAttribute, EventFormChangelogEntry } from '../../utils/eventFileUtils';
import { getDefaultVersion } from '../../utils/eventFileUtils';

export const platformOptions = platformsFromConstants.filter(p => p.value !== 'all');

export const defaultChangelogEntry = (): EventFormChangelogEntry => ({
    version: getDefaultVersion(),
    notes: '',
});

export const defaultAttribute = (): EventFormAttribute => ({
    key: '',
    description: '',
    runtimeType: 'string',
    isOptional: false,
    changelog: [defaultChangelogEntry()],
});

/** Valid type: identifiers, unions, arrays, optional ?; allows single and double-quoted strings; rejects empty. */
export const ATTRIBUTE_TYPE_REGEX = /^[\w\s[\]()|'"?.<>,\\-]+$/;

export const isValidAttributeType = (value: string): boolean =>
    value.trim() !== '' && ATTRIBUTE_TYPE_REGEX.test(value.trim());

export const ATTRIBUTE_TYPE_REFERENCE_ITEMS: { type: string; description: string }[] = [
    { type: 'string', description: 'Řetězec' },
    { type: 'number', description: 'Číslo' },
    { type: 'boolean', description: 'Pravda/nepravda' },
    { type: 'string?', description: 'Volitelný řetězec (optional)' },
    { type: "'a' | 'b'", description: 'Union literálů' },
    { type: 'string | number', description: 'Union typů' },
    { type: 'string[]', description: 'Pole (array)' },
];

export const CHANGELOG_ERROR_MESSAGES: Record<
    'no_entry' | 'invalid_version' | 'empty_notes',
    string
> = {
    no_entry: 'Alespoň jeden záznam je povinný.',
    invalid_version: 'Verze musí být ve tvaru x.y.z nebo ?.',
    empty_notes: 'Notes jsou povinné u záznamu s platnou verzí.',
};
