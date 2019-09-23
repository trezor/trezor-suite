import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { H1, H4, P, H6 } from '@trezor/components';

import { NEXT_WALLET_URL, PASSWORD_MANAGER_URL } from '@onboarding-constants/urls';
import { Wrapper, Option } from '@onboarding-components';

import l10nMessages from './index.messages';

const OptionHeading = styled(H6)`
    display: flex;
    align-items: flex-end;
    flex: 2;
    width: 100%;
`;

const OptionDesc = styled(P)`
    display: flex;
    flex: 3;
    font-size: 0.9rem;
    align-items: flex-start;
    width: 100%;
`;

// TODO: use url constants
const WalletOption = () => (
    <Option
        onClick={() => {
            // TODO: bind goto
            // goto('wallet-index');
        }}
    >
        <OptionHeading>
            <FormattedMessage {...l10nMessages.TR_TREZOR_STABLE_WALLET} />
        </OptionHeading>
        <OptionDesc>
            <FormattedMessage {...l10nMessages.TR_TREZOR_STABLE_WALLET} />
        </OptionDesc>
    </Option>
);

const PasswordManagerOption = () => (
    <Option
        onClick={() => {
            window.location.href = PASSWORD_MANAGER_URL;
        }}
    >
        <OptionHeading>
            <FormattedMessage {...l10nMessages.TR_TREZOR_PASSWORD_MANAGER} />
        </OptionHeading>
        <OptionDesc>
            <FormattedMessage {...l10nMessages.TR_TREZOR_PASSWORD_MANAGER_DESCRIPTION} />
        </OptionDesc>
    </Option>
);

const EthereumBetaWalletOption = () => (
    <Option
        onClick={() => {
            window.location.href = NEXT_WALLET_URL;
        }}
    >
        <OptionHeading>
            <FormattedMessage {...l10nMessages.TR_TREZOR_ETHEREUM_WALLET} />
        </OptionHeading>
        <OptionDesc>
            <FormattedMessage {...l10nMessages.TR_TREZOR_ETHEREUM_WALLET_DESCRIPTION} />
        </OptionDesc>
    </Option>
);

const FinalStep = () => (
    <Wrapper.Step>
        <H1>
            <FormattedMessage {...l10nMessages.TR_FINAL_HEADING} />
        </H1>

        <H4>
            <FormattedMessage {...l10nMessages.TR_FINAL_SUBHEADING} />
        </H4>

        <Wrapper.Options>
            <WalletOption />
            <PasswordManagerOption />
            <EthereumBetaWalletOption />
        </Wrapper.Options>
    </Wrapper.Step>
);

export default FinalStep;
