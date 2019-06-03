/* eslint-disable jsx-a11y/accessible-emoji */
/* @flow */
import * as React from 'react';
import { Header, LanguagePicker } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import type { toggleSidebar as toggleSidebarType } from 'actions/WalletActions';
import l10nMessages from './index.messages';

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
        logoLinkComponent={<Link to="/" />}
        rightAddon={<LanguagePicker />}
    />
);

const mapStateToProps = (state: State) => ({
    language: state.suite.language,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    fetchLocale: bindActionCreators(fetchLocale, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(MyHeader);


export default MyHeader;
