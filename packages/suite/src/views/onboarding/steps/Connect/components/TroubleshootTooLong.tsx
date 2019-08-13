import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { H6, Link, Button } from '@trezor/components';

import { SUPPORT_URL } from '@onboarding-constants/urls';
import Text from '@onboarding-components/Text';
import { ButtonAlt } from '@onboarding-components/Buttons';
import { ControlsWrapper } from '@onboarding-components/Wrapper';
import l10nMessages from './TroubleshootTooLong.messages';

const Card = styled.div`
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    transition: 0.3s;
    text-align: left;
    width: 80%;
    margin: 10px;
    padding: 10px;

    ${Text} {
        text-align: left;
        padding: 0;
    }
    /* border-radius: 5px; */
`;

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

        <Card>
            <H6>Abcd</H6>
            <Text>
                <FormattedMessage {...l10nMessages.TR_REFRESH_INSTRUCTION} />
            </Text>
        </Card>
        <Card>
            <H6>Abcd</H6>
            <Text>
                <FormattedMessage {...l10nMessages.TR_ANOTHER_CABLE_INSTRUCTION} />
            </Text>
        </Card>
        <ControlsWrapper>
            <ButtonAlt>
                <FormattedMessage
                    {...l10nMessages.TR_LAST_RESORT_INSTRUCTION}
                    values={{ ContactSupportLink }}
                />
            </ButtonAlt>
        </ControlsWrapper>
    </React.Fragment>
);

export default TroubleshootSearchingTooLong;
