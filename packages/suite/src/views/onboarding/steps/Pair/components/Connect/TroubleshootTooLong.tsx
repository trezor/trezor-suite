/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { P, Link } from '@trezor/components-v2';
import TrezorConnect from 'trezor-connect';

import { SUPPORT_URL, TROUBLESHOOTER_URL } from '@onboarding-constants/urls';
import { Text, OnboardingButton, Wrapper } from '@onboarding-components';
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
`;

const ContactSupportLink = (
    <Link href={SUPPORT_URL}>
        <FormattedMessage {...l10nMessages.TR_CONTACT_TREZOR_SUPPORT_LINK} />
    </Link>
);

interface Props {
    webusb: boolean;
}

const TroubleshootSearchingTooLong = ({ webusb }: Props) => (
    <>
        {/* <Text>
            <FormattedMessage {...l10nMessages.TR_SEARCHING_TAKES_TOO_LONG} />
        </Text> */}

        <Card>
            <P weight="bold">Troubleshooting guide</P>
            <Text>
                Check out our interactive{' '}
                <Link href={TROUBLESHOOTER_URL}>troubleshooting guide</Link>
                {/* <FormattedMessage {...l10nMessages.TR_REFRESH_INSTRUCTION} /> */}
            </Text>
        </Card>
        {!webusb && (
            <Card>
                <P weight="bold">Broken cable</P>
                <Text>
                    <FormattedMessage {...l10nMessages.TR_ANOTHER_CABLE_INSTRUCTION} />
                </Text>
            </Card>
        )}

        {webusb && (
            <Card>
                <P weight="bold">Try Trezor bridge</P>
                <Text>
                    You may install{' '}
                    <Link onClick={() => TrezorConnect.disableWebUSB()}>Trezor Bridge</Link> is a
                    special communication daemon running in background on your computer
                </Text>
            </Card>
        )}
        <Wrapper.Controls>
            <OnboardingButton.Alt>
                <FormattedMessage
                    {...l10nMessages.TR_LAST_RESORT_INSTRUCTION}
                    values={{ ContactSupportLink }}
                />
            </OnboardingButton.Alt>
        </Wrapper.Controls>
    </>
);

export default TroubleshootSearchingTooLong;
