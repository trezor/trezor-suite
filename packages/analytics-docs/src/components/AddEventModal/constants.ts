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

/** Valid type: identifiers, unions, arrays, index signatures { [k: string]: T }; allows single and double-quoted strings; rejects empty. */
export const ATTRIBUTE_TYPE_REGEX = /^[\w\s[\](){}|'"?.<>,\\:;-]+$/;

export const isValidAttributeType = (value: string): boolean =>
    value.trim() !== '' && ATTRIBUTE_TYPE_REGEX.test(value.trim());

export const ATTRIBUTE_TYPE_REFERENCE_ITEMS: { type: string; description: string }[] = [
    { type: 'string', description: 'Text, e.g. networkName, deviceModel' },
    { type: 'number', description: 'Integer or decimal, e.g. 0, 42, 1.5' },
    { type: 'boolean', description: 'true or false' },
    { type: "'sent' | 'received'", description: 'Fixed set of string values (union literals)' },
    { type: 'string | number', description: 'Either string or number' },
    { type: 'string[]', description: 'List of strings, e.g. ["a", "b"]' },
];

export const CHANGELOG_ERROR_MESSAGES: Record<
    'no_entry' | 'invalid_version' | 'empty_notes',
    string
> = {
    no_entry: 'At least one entry is required.',
    invalid_version: 'Version has to be in form x.y.z or ?.',
    empty_notes: 'Notes are required for an entry with a valid version.',
};
