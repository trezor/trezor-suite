/* eslint-disable jsx-a11y/accessible-emoji */
/* @flow */
import * as React from 'react';
import { Header } from 'trezor-ui-components';
import { FormattedMessage } from 'react-intl';

import type { toggleSidebar as toggleSidebarType } from 'actions/WalletActions';
import l10nMessages from './index.messages';

import LanguagePicker from './components/LanguagePicker/Container';

type MyProps = {
    sidebarEnabled?: boolean,
    sidebarOpened?: ?boolean,
    toggleSidebar?: toggleSidebarType,
};

const MyHeader = ({ sidebarEnabled, sidebarOpened, toggleSidebar }: MyProps) => (
    <Header
        sidebarEnabled={sidebarEnabled}
        sidebarOpened={sidebarOpened}
        toggleSidebar={toggleSidebar}
        togglerOpenText={<FormattedMessage {...l10nMessages.TR_MENU} />}
        togglerCloseText={<FormattedMessage {...l10nMessages.TR_MENU_CLOSE} />}
        links={[
            {
                href: 'https://trezor.io/',
                title: <FormattedMessage {...l10nMessages.TR_TREZOR} />,
            },
            {
                href: 'https://wiki.trezor.io/',
                title: <FormattedMessage {...l10nMessages.TR_WIKI} />,
            },
            {
                href: 'https://blog.trezor.io/',
                title: <FormattedMessage {...l10nMessages.TR_BLOG} />,
            },
            {
                href: 'https://trezor.io/support/',
                title: <FormattedMessage {...l10nMessages.TR_SUPPORT} />,
            },
        ]}
        rightAddon={<LanguagePicker />}
    />
);

export default MyHeader;
