import { FormattedMessage } from 'react-intl';

import styled from 'styled-components';

import { analytics, EventType } from '@trezor/connect-analytics';
import { createUiResponse, UI, UiEvent, PostMessage } from '@trezor/connect';
import { variables, PassphraseTypeCard } from '@trezor/components';

import { View } from '../components/View';

const Wrapper = styled.div<{ authConfirmation?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 600px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
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
    background: ${({ theme }) => theme.STROKE_GREY};
`;

export type PassphraseEventProps = Extract<UiEvent, { type: 'ui-request_passphrase' }>;

type PassphraseProps = PassphraseEventProps & { postMessage: PostMessage };

export const Passphrase = (props: PassphraseProps) => {
    const { device } = props.payload;
    const { features } = device;

    const onPassphraseSubmit = (value: string, passphraseOnDevice?: boolean) => {
        props.postMessage(
            createUiResponse(UI.RECEIVE_PASSPHRASE, {
                value,
                passphraseOnDevice,
                // todo: what is this param?
                save: true,
            }),
        );

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
                                defaultMessage="Hidden wallet"
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
                                defaultMessage="Access Hidden wallet"
                            />
                        }
                        type="hidden"
                        offerPassphraseOnDevice={offerPassphraseOnDevice}
                        onSubmit={onPassphraseSubmit}
                        learnMoreTooltipAppendTo={() =>
                            document
                                .getElementById('react')!
                                .shadowRoot!.getElementById('reactRenderIn')!
                        }
                    />
                </WalletsWrapper>
            </Wrapper>
        </View>
    );
};
