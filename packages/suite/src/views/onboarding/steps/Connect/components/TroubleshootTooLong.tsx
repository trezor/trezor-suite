import React from 'react';
import { P, Link } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { UnorderedList } from '@suite/components/onboarding/Lists';
import { SUPPORT_URL } from '@suite/config/onboarding/urls';
import Text from '@suite/components/onboarding/Text';

import l10nMessages from './TroubleshootTooLong.messages';

const ContactSupportLink = (
    <Link href={SUPPORT_URL}>
        <FormattedMessage {...l10nMessages.TR_CONTACT_TREZOR_SUPPORT_LINK} />
    </Link>
);

const TroubleshootSearchingTooLong = () => (
    <React.Fragment>
        <Text>
            <FormattedMessage {...l10nMessages.TR_SEARCHING_TAKES_TOO_LONG} />
        </Text>
        <UnorderedList
            items={[
                {
                    component: (
                        <P>
                            <FormattedMessage {...l10nMessages.TR_REFRESH_INSTRUCTION} />
                        </P>
                    ),
                    key: '2',
                },
                {
                    component: (
                        <P>
                            <FormattedMessage {...l10nMessages.TR_ANOTHER_CABLE_INSTRUCTION} />
                        </P>
                    ),
                    key: '3',
                },
                {
                    component: (
                        <P>
                            <FormattedMessage
                                {...l10nMessages.TR_LAST_RESORT_INSTRUCTION}
                                values={{ ContactSupportLink }}
                            />
                        </P>
                    ),
                    key: '4',
                },
            ]}
        />
    </React.Fragment>
);

export default TroubleshootSearchingTooLong;
