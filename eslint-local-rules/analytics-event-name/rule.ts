import type { Rule } from 'eslint';

import { ANALYTICS_ALLOWED_DOMAINS, validateAnalyticsEventName } from '@suite-common/analytics';

export const analyticsEventNameRule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Enforces analytics EventType enum values to use format Domain/event with allowed domains and kebab-case for the event part.',
            category: 'Best Practices',
            recommended: false,
        },
        messages: {
            invalidFormat:
                "Event name must be in format 'domain/event' with exactly one '/' (e.g. 'settings/app-log-exported'). Use one of the allowed domains and kebab-case for the event part.",
            invalidDomain: `Invalid domain '{{domain}}'. Allowed: ${ANALYTICS_ALLOWED_DOMAINS.join(', ')}.`,
            notKebabCase:
                "Event part after domain must use kebab-case (e.g. 'app-log-exported'), got '{{eventPart}}'.",
        },
        schema: [],
    },
    create(context) {
        return {
            TSEnumDeclaration(node: Rule.Node) {
                const enumNode = node as Rule.Node & {
                    id?: { name?: string };
                    members?: Array<{
                        initializer?: Rule.Node & { type?: string; value?: string };
                    }>;
                };
                if (enumNode.id?.name !== 'EventType') {
                    return;
                }

                for (const member of enumNode.members ?? []) {
                    const { initializer } = member;
                    if (initializer?.type !== 'Literal' || typeof initializer.value !== 'string') {
                        continue;
                    }

                    const error = validateAnalyticsEventName(initializer.value);
                    if (error) {
                        context.report({
                            node: initializer,
                            messageId: error.messageId,
                            data: 'data' in error ? error.data : {},
                        });
                    }
                }
            },
        };
    },
};
