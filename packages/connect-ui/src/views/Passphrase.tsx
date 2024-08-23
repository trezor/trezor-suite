import { FormattedMessage } from 'react-intl';

import styled from 'styled-components';

import { analytics, EventType } from '@trezor/connect-analytics';
import { UI, UiEvent, CoreRequestMessage } from '@trezor/connect';
import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { View } from '../components/View';
import { PassphraseTypeCard } from '../components/Passphrase/PassphraseTypeCard';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 600px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: calc(100vw - ${spacingsPx.xxxl});
    }
`;

const WalletsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const Divider = styled.div`
    margin: 16px;
    height: 1px;
    background: ${({ theme }) => theme.legacy.STROKE_GREY};
`;

export type PassphraseEventProps = Extract<UiEvent, { type: 'ui-request_passphrase' }>;

type PassphraseProps = PassphraseEventProps & {
    postMessage: (message: CoreRequestMessage) => void;
};

export const Passphrase = (props: PassphraseProps) => {
    const { device } = props.payload;
    const { features } = device;

    const onPassphraseSubmit = (value: string, passphraseOnDevice?: boolean) => {
        props.postMessage({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value,
                passphraseOnDevice,
                // see PassphrasePromptResponse type
                save: true,
            },
        });

        analytics.report({
            type: EventType.WalletType,
            payload: {
                type: value ? 'hidden' : 'standard',
            },
        });
    };

    const offerPassphraseOnDevice =
        features &&
        features.capabilities &&
        features.capabilities.includes('Capability_PassphraseEntry');

    const appendTo = document.getElementById('react')!.shadowRoot!.getElementById('reactRenderIn')!;

    return (
        <View title="">
            {/* todo: this part could be shared with suite? */}
            {/* maybe there could be package 'ui-flows' with something between app level logic and simple components? */}
            <Wrapper>
                <WalletsWrapper>
                    <PassphraseTypeCard
                        title={
                            <FormattedMessage
                                id="TR_NO_PASSPHRASE_WALLET"
                                defaultMessage="Standard wallet"
                            />
                        }
                        description={
                            <FormattedMessage
                                id="TR_STANDARD_WALLET_DESCRIPTION"
                                defaultMessage="No passphrase"
                            />
                        }
                        submitLabel={
                            <FormattedMessage
                                id="TR_ACCESS_STANDARD_WALLET"
                                defaultMessage="Access standard wallet"
                            />
                        }
                        type="standard"
                        onSubmit={onPassphraseSubmit}
                    />
                    <Divider />
                    <PassphraseTypeCard
                        title={
                            <FormattedMessage
                                id="TR_WALLET_SELECTION_HIDDEN_WALLET"
                                defaultMessage="Passphrase wallet"
                            />
                        }
                        description={
                            <FormattedMessage
                                id="TR_HIDDEN_WALLET_DESCRIPTION"
                                defaultMessage="Passphrase is required"
                            />
                        }
                        submitLabel={
                            <FormattedMessage
                                id="TR_WALLET_SELECTION_ACCESS_HIDDEN_WALLET"
                                defaultMessage="Access Passphrase wallet"
                            />
                        }
                        type="hidden"
                        offerPassphraseOnDevice={offerPassphraseOnDevice}
                        onSubmit={onPassphraseSubmit}
                        learnMoreTooltipAppendTo={appendTo}
                    />
                </WalletsWrapper>
            </Wrapper>
        </View>
    );
};
