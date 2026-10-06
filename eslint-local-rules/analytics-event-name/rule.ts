import type { Rule } from 'eslint';

const allowedDomains = new Set([
    'accounts',
    'app',
    'coin',
    'dashboard',
    'device',
    'feedback',
    'firmware',
    'guide',
    'menu',
    'onboarding',
    'passphrase',
    'promo',
    'receive',
    'send',
    'settings',
    'staking',
    'yield',
    'trading',
    'transaction',
    'wallet-connect',
]);
const kebabCaseSegment = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const validateEventName = (
    value: string,
): { messageId: string; data?: Record<string, string> } | null => {
    if (!value.includes('/')) {
        return { messageId: 'invalidFormat' };
    }
    const parts = value.split('/');
    const domain = parts[0];
    const eventSegments = parts.slice(1);
    if (domain === undefined) {
        return { messageId: 'invalidFormat' };
    }

    if (!allowedDomains.has(domain)) {
        return { messageId: 'invalidDomain', data: { domain } };
    }
    for (const segment of eventSegments) {
        if (!kebabCaseSegment.test(segment)) {
            return { messageId: 'notKebabCase', data: { eventPart: value } };
        }
    }

    return null;
};

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
                "Event name must be in format 'domain/event' (e.g. 'settings/app-log-exported'). Use one of the allowed domains and kebab-case for the event part.",
            invalidDomain:
                "Invalid domain '{{domain}}'. Allowed: accounts, app, coin, dashboard, device, feedback, firmware, guide, menu, passphrase, promo, receive, send, settings, staking, trading, transaction, wallet-connect.",
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

                    const error = validateEventName(initializer.value);
                    if (error) {
                        context.report({
                            node: initializer,
                            messageId: error.messageId,
                            data: error.data ?? {},
                        });
                    }
                }
            },
        };
    },
};
