import { useMemo } from 'react';

import { type TranslationFunction, useTranslation } from '@suite/intl';

import { type Command } from './commands/types';

const scoreMatch = (
    query: string,
    command: Command,
    translationString: TranslationFunction,
): number => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return 1;

    const label = (
        command.label ?? (command.labelKey ? translationString(command.labelKey) : '')
    ).toLowerCase();
    const description = (
        command.description ??
        (command.descriptionKey ? translationString(command.descriptionKey) : '')
    ).toLowerCase();
    const keywordsStr = command.keywords.join(' ').toLowerCase();
    const searchable = `${label} ${description} ${keywordsStr}`;

    if (label.startsWith(normalizedQuery)) return 100;

    if (label.split(/\s+/).some(word => word.startsWith(normalizedQuery))) return 80;

    if (label.includes(normalizedQuery)) return 60;

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const words = searchable.split(/[\s_\-/]+/).filter(Boolean);
    const hasAllTokensMatched = tokens.every(token => words.some(word => word.startsWith(token)));
    if (hasAllTokensMatched) return 40;

    if (searchable.includes(normalizedQuery)) return 20;

    return 0;
};

export const useCommandSearch = (commands: Command[], query: string): Command[] => {
    const { translationString } = useTranslation();

    return useMemo(() => {
        const scored = commands
            .map(command => ({
                command,
                score: scoreMatch(query, command, translationString),
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        return scored.map(item => item.command);
    }, [commands, query, translationString]);
};
