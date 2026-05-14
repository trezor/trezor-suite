import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { Column, Row, ShortcutBadge, type ShortcutBadgeProps } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { spacingsPx, typography } from '@trezor/theme';

import { setView } from 'src/actions/suite/guideActions';
import { GuideContent, GuideHeader, GuideViewWrapper } from 'src/components/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';

const SectionHeader = styled.h3`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.contentSecondary};
    padding: ${spacingsPx.sm} 0;
`;

const ShortcutLabel = styled.span`
    ${typography['body-sm']}
    color: ${({ theme }) => theme.contentPrimary};
`;

type ShortcutKeys = ShortcutBadgeProps['shortcut'];

interface ShortcutItem {
    labelId: Parameters<typeof Translation>[0]['id'];
    keys: ShortcutKeys[];
    isDebugOnly?: boolean;
}

const generalShortcuts: ShortcutItem[] = [
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_OPEN_GUIDE',
        keys: [['F1']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_PASSPHRASE',
        keys: [['ALT', 'KEY_P']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_DEVICE',
        keys: [['ALT', 'KEY_D']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SETTINGS',
        keys: [['CTRL', 'COMMA']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_FIND',
        keys: [['CTRL', 'KEY_F']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_ACCOUNT',
        keys: [['CTRL', 'KEY_1']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEND',
        keys: [['ALT', 'KEY_S']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_TOGGLE_THEME',
        keys: [['ALT', 'KEY_T']],
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEARCH_ACCOUNTS',
        keys: [['CTRL', 'KEY_K']],
    },
];

const desktopShortcuts: ShortcutItem[] = [
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LOCK_APP',
        keys: [['ALT', 'SHIFT', 'KEY_L']],
    },
];

const debugShortcuts: ShortcutItem[] = [
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_NEXT',
        keys: [['CTRL', 'F9']],
        isDebugOnly: true,
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_PREV',
        keys: [['CTRL', 'F7']],
        isDebugOnly: true,
    },
    {
        labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_KEYS_SWITCH',
        keys: [['CTRL', 'F12']],
        isDebugOnly: true,
    },
];

const ShortcutEntry = ({ labelId, keys }: ShortcutItem) => (
    <Row justifyContent="space-between" alignItems="center">
        <ShortcutLabel>
            <Translation id={labelId} />
        </ShortcutLabel>
        <Row gap={4}>
            {keys.map((combo, index) => (
                <ShortcutBadge key={index} shortcut={combo} />
            ))}
        </Row>
    </Row>
);

export const GuideShortcuts = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={<Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS" />} />
            <GuideContent>
                <Column>
                    <SectionHeader>
                        <Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS_GENERAL" />
                    </SectionHeader>
                    {generalShortcuts.map(shortcut => (
                        <ShortcutEntry key={shortcut.labelId} {...shortcut} />
                    ))}

                    {isDesktop() && (
                        <>
                            <SectionHeader>
                                <Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS_DESKTOP" />
                            </SectionHeader>
                            {desktopShortcuts.map(shortcut => (
                                <ShortcutEntry key={shortcut.labelId} {...shortcut} />
                            ))}
                        </>
                    )}

                    {isDebugModeActive && (
                        <>
                            <SectionHeader>
                                <Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS_DEBUG" />
                            </SectionHeader>
                            {debugShortcuts.map(shortcut => (
                                <ShortcutEntry key={shortcut.labelId} {...shortcut} />
                            ))}
                        </>
                    )}
                </Column>
            </GuideContent>
        </GuideViewWrapper>
    );
};
