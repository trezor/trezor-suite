import { useDispatch } from 'react-redux';

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
import { useSelector } from 'src/hooks/suite';

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
    keys: ['ALT', 'KEY_L'],
};

const generalSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_GENERAL',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_OPEN_GUIDE',
            keys: ['F1'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_OPEN_SHORTCUTS',
            keys: ['QUESTION_MARK'],
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
    ],
};

const securitySection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SECURITY',
    items: [
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
            keys: ['ALT', 'KEY_W'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEARCH_ACCOUNTS',
            keys: ['MOD', 'KEY_K'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_ADD_ACCOUNT',
            keys: ['ALT', 'KEY_A'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_DASHBOARD',
            keys: ['MOD', 'ALT', 'KEY_0'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_ACCOUNT',
            keys: ['MOD', 'ALT', 'KEY_1'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_PREV_ACCOUNT',
            keys: ['ALT', 'KEY_K'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_NEXT_ACCOUNT',
            keys: ['ALT', 'KEY_J'],
        },
    ],
};

const navigationSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_NAVIGATION',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEND',
            keys: ['ALT', 'KEY_S'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_RECEIVE',
            keys: ['ALT', 'KEY_R'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWAP',
            keys: ['ALT', 'KEY_X'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_BUY',
            keys: ['ALT', 'KEY_B'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SELL',
            keys: ['ALT', 'KEY_C'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_EARN',
            keys: ['ALT', 'KEY_E'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_NETWORKS',
            keys: ['ALT', 'KEY_N'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_ACTIVITY',
            keys: ['ALT', 'KEY_I'],
        },
    ],
};

const otherSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_OTHER',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_FOCUS_NEXT',
            keys: ['TAB'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_FOCUS_PREVIOUS',
            keys: ['SHIFT', 'TAB'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_ACTIVATE',
            keys: ['ENTER'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_CLOSE',
            keys: ['ESCAPE'],
        },
    ],
};

const debugSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_DEBUG',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_DEBUG_MODE',
            keys: ['MOD', 'ALT', 'SHIFT', 'KEY_D'],
        },
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

    // Lock app is desktop-only, so it's appended to the Security section only there.
    const securitySectionWithLockApp: ShortcutSection = isDesktop()
        ? { ...securitySection, items: [...securitySection.items, lockAppShortcut] }
        : securitySection;

    const walletsSectionWithPassphrase: ShortcutSection = isPassphraseProtectionEnabled
        ? { ...walletsSection, items: [passphraseShortcut, ...walletsSection.items] }
        : walletsSection;

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={<Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS" />} />
            <GuideContent>
                <Column>
                    <ShortcutSectionBlock {...securitySectionWithLockApp} />
                    <ShortcutSectionBlock {...walletsSectionWithPassphrase} />
                    <ShortcutSectionBlock {...navigationSection} />
                    <ShortcutSectionBlock {...generalSection} />
                    <ShortcutSectionBlock {...otherSection} />
                    {isDebugModeActive && <ShortcutSectionBlock {...debugSection} />}
                </Column>
            </GuideContent>
        </GuideViewWrapper>
    );
};
