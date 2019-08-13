import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { H1, H4, P, H6 } from '@trezor/components';

import { NEXT_WALLET_URL, PASSWORD_MANAGER_URL, WALLET_URL } from '@onboarding-constants/urls';
import Option from '@onboarding-components/Option';
import { StepWrapper, OptionsWrapper } from '@onboarding-components/Wrapper';
import l10nMessages from './index.messages';

const OptionDesc = styled(P)`
    font-size: 0.9rem;
`;

// TODO: use url constants
const WalletOption = () => (
    <Option
        onClick={() => {
            window.location.href = WALLET_URL;
        }}
    >
        <H6>
            <FormattedMessage {...l10nMessages.TR_TREZOR_STABLE_WALLET} />
        </H6>
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
        <H6>
            <FormattedMessage {...l10nMessages.TR_TREZOR_PASSWORD_MANAGER} />
        </H6>
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
        <H6>
            <FormattedMessage {...l10nMessages.TR_TREZOR_ETHEREUM_WALLET} />
        </H6>
        <OptionDesc>
            <FormattedMessage {...l10nMessages.TR_TREZOR_ETHEREUM_WALLET_DESCRIPTION} />
        </OptionDesc>
    </Option>
);

const FinalStep = () => (
    <StepWrapper>
        <H1>
            <FormattedMessage {...l10nMessages.TR_FINAL_HEADING} />
        </H1>

        <H4>
            <FormattedMessage {...l10nMessages.TR_FINAL_SUBHEADING} />
        </H4>

        <OptionsWrapper>
            <WalletOption />
            <PasswordManagerOption />
            <EthereumBetaWalletOption />
        </OptionsWrapper>
    </StepWrapper>
);

export default FinalStep;
