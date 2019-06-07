import React from 'react';
import styled from 'styled-components';
import { H1, H4, P, H6 } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { OptionsList } from '@suite/components/onboarding/Options';
import { StepWrapper, ControlsWrapper } from '@suite/components/onboarding/Wrapper';
import l10nMessages from './index.messages';

const OptionBody = styled.div`
    margin-bottom: auto;
`;

const OptionDesc = styled(P)`
    font-size: 0.9rem;
`;

const WalletOption = () => (
    <OptionBody>
        <H6>
            <FormattedMessage {...l10nMessages.TR_TREZOR_STABLE_WALLET} />
        </H6>
        <OptionDesc>
            <FormattedMessage {...l10nMessages.TR_TREZOR_STABLE_WALLET} />
        </OptionDesc>
    </OptionBody>
);

const PasswordManagerOption = () => (
    <OptionBody>
        <H6>
            <FormattedMessage {...l10nMessages.TR_TREZOR_PASSWORD_MANAGER} />
        </H6>
        <OptionDesc>
            <FormattedMessage {...l10nMessages.TR_TREZOR_PASSWORD_MANAGER_DESCRIPTION} />
        </OptionDesc>
    </OptionBody>
);

const EthereumBetaWalletOption = () => (
    <OptionBody>
        <H6>
            <FormattedMessage {...l10nMessages.TR_TREZOR_ETHEREUM_WALLET} />
        </H6>
        <OptionDesc>
            <FormattedMessage {...l10nMessages.TR_TREZOR_ETHEREUM_WALLET_DESCRIPTION} />
        </OptionDesc>
    </OptionBody>
);

const FinalStep = () => (
    <StepWrapper>
        <H1>
            <FormattedMessage {...l10nMessages.TR_FINAL_HEADING} />
        </H1>

        <H4>
            <FormattedMessage {...l10nMessages.TR_FINAL_SUBHEADING} />
        </H4>

        <ControlsWrapper>
            <OptionsList
                options={[
                    {
                        content: <WalletOption />,
                        key: 1,
                        onClick: () => {
                            window.location.href = 'https://wallet.trezor.io';
                        },
                    },
                    {
                        content: <PasswordManagerOption />,
                        key: 2,
                        onClick: () => {
                            window.location.href = 'https://trezor.io/passwords';
                        },
                    },
                    {
                        content: <EthereumBetaWalletOption />,
                        key: 3,
                        onClick: () => {
                            window.location.href = 'https://beta-wallet.trezor.io/next';
                        },
                    },
                ]}
                selected={null}
            />
        </ControlsWrapper>
    </StepWrapper>
);

export default FinalStep;
