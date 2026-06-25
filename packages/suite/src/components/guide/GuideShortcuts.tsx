import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { selectIsDeviceProtectedByPassphrase } from '@suite-common/device';
import {
    Box,
    CardList,
    Column,
    Paragraph,
    ShortcutBadge,
    type ShortcutBadgeProps,
    Text,
} from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { setView } from 'src/actions/suite/guideActions';
import { GuideContent, GuideHeader, GuideViewWrapper } from 'src/components/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';

type ShortcutKeys = ShortcutBadgeProps['shortcut'];
type TranslationId = Parameters<typeof Translation>[0]['id'];

interface ShortcutItem {
    labelId: TranslationId;
    keys: ShortcutKeys;
}

interface ShortcutSection {
    titleId: TranslationId;
    items: ShortcutItem[];
}

const passphraseShortcut: ShortcutItem = {
    labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_PASSPHRASE',
    keys: ['ALT', 'KEY_P'],
};

const lockAppShortcut: ShortcutItem = {
    labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LOCK_APP',
    keys: ['ALT', 'SHIFT', 'KEY_L'],
};

const generalSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_GENERAL',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_OPEN_GUIDE',
            keys: ['F1'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SETTINGS',
            keys: ['MOD', 'COMMA'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_FIND',
            keys: ['MOD', 'KEY_F'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_TOGGLE_THEME',
            keys: ['ALT', 'KEY_T'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_TOGGLE_BALANCES',
            keys: ['ALT', 'KEY_H'],
        },
    ],
};

const walletsSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_WALLETS',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_DEVICE',
            keys: ['ALT', 'KEY_D'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEARCH_ACCOUNTS',
            keys: ['MOD', 'KEY_K'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_ACCOUNT',
            keys: ['MOD', 'KEY_1'],
        },
    ],
};

const transactionsSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_TRANSACTIONS',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEND',
            keys: ['ALT', 'KEY_S'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_RECEIVE',
            keys: ['ALT', 'KEY_R'],
        },
    ],
};

const debugSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_DEBUG',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_NEXT',
            keys: ['CTRL', 'F9'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_PREV',
            keys: ['CTRL', 'F7'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_KEYS_SWITCH',
            keys: ['CTRL', 'F12'],
        },
    ],
};

const ShortcutEntry = ({ labelId, keys }: ShortcutItem) => (
    <CardList.Item paddingType="small">
        <Text typographyStyle="body-md">
            <Translation id={labelId} />
        </Text>
        <ShortcutBadge shortcut={keys} />
    </CardList.Item>
);

const ShortcutSectionBlock = ({ titleId, items }: ShortcutSection) => (
    <Box margin={{ bottom: 24 }}>
        <Column gap={16}>
            <Paragraph typographyStyle="body-md" intent="neutral">
                <Translation id={titleId} />
            </Paragraph>
            <CardList>
                {items.map(item => (
                    <ShortcutEntry key={item.labelId} {...item} />
                ))}
            </CardList>
        </Column>
    </Box>
);

export const GuideShortcuts = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const isPassphraseProtectionEnabled = useSelector(selectIsDeviceProtectedByPassphrase);
    const dispatch = useDispatch();

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));

    const generalSectionWithLockApp: ShortcutSection = isDesktop()
        ? { ...generalSection, items: [...generalSection.items, lockAppShortcut] }
        : generalSection;

    const walletsSectionWithPassphrase: ShortcutSection = isPassphraseProtectionEnabled
        ? { ...walletsSection, items: [passphraseShortcut, ...walletsSection.items] }
        : walletsSection;

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={<Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS" />} />
            <GuideContent>
                <Column>
                    <ShortcutSectionBlock {...generalSectionWithLockApp} />
                    <ShortcutSectionBlock {...walletsSectionWithPassphrase} />
                    <ShortcutSectionBlock {...transactionsSection} />
                    {isDebugModeActive && <ShortcutSectionBlock {...debugSection} />}
                </Column>
            </GuideContent>
        </GuideViewWrapper>
    );
};
