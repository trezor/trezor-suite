import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { H2 } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SUITE } from '@suite-actions/constants';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import { Section } from '@suite-components/Settings';
import { AppState, Dispatch } from '@suite-types';
import { FIAT } from '@suite-config';
import * as settingsActions from '@wallet-actions/settingsActions';

const buildCurrencyOption = (currency: string) => {
    return {
        value: currency,
        label: currency.toUpperCase(),
    };
};

const mapStateToProps = (state: AppState) => ({
    // device: state.suite.device,
    locks: state.suite.locks,
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setLocalCurrency: bindActionCreators(settingsActions.setLocalCurrency, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const BottomContainer = styled.div`
    margin-top: auto;
`;

const Settings = ({ locks, wallet, setLocalCurrency }: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);

    return (
        <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
            {/* todo: imho base padding should be in SuiteLayout, but it would break WalletLayout, so I have it temporarily here */}
            <div
                style={{
                    padding: '30px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <H2>General</H2>

                <Section
                    controlsDisabled={uiLocked}
                    header={<Translation>{messages.TR_CURRENCY}</Translation>}
                    rows={
                        [
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>{messages.TR_PRIMARY_FIAT}</Translation>
                                        ),
                                    },
                                ],
                                right: [
                                    {
                                        type: 'select',
                                        props: {
                                            onChange: (option: { value: string; label: string }) =>
                                                setLocalCurrency(option.value),
                                            value: buildCurrencyOption(
                                                wallet.settings.localCurrency,
                                            ),
                                            options: FIAT.currencies.map(c =>
                                                buildCurrencyOption(c),
                                            ),
                                        },
                                    },
                                ],
                            },
                        ] as const
                    }
                />

                <Section
                    controlsDisabled={uiLocked}
                    header={<Translation>{messages.TR_LABELING}</Translation>}
                    rows={
                        [
                            {
                                left: [
                                    {
                                        type: 'description',
                                        value: (
                                            <Translation>
                                                {messages.TR_DROPBOX_CONNECTION}
                                            </Translation>
                                        ),
                                    },
                                ],
                                right: [
                                    {
                                        type: 'button',
                                        value: (
                                            <Translation>{messages.TR_CONNECT_DROPBOX}</Translation>
                                        ),
                                        props: {
                                            onClick: () => console.log('fooo'),
                                        },
                                    },
                                ],
                            },
                        ] as const
                    }
                />
                <BottomContainer>
                    <Section
                        borderless
                        controlsDisabled={uiLocked}
                        rows={
                            [
                                {
                                    left: [
                                        {
                                            type: 'description',
                                            value: (
                                                <Translation>
                                                    {messages.TR_SUITE_VERSION}
                                                </Translation>
                                            ),
                                        },
                                        {
                                            type: 'small-description',
                                            value: (
                                                <Translation>
                                                    {messages.TR_YOUR_CURRENT_VERSION}
                                                </Translation>
                                            ),
                                        },
                                    ],
                                    right: [
                                        {
                                            type: 'button',
                                            value: (
                                                <Translation>
                                                    {messages.TR_CHECK_FOR_UPDATES}
                                                </Translation>
                                            ),
                                            props: {
                                                onClick: () => console.log('fooo'),
                                            },
                                        },
                                    ],
                                },
                            ] as const
                        }
                    />
                </BottomContainer>
            </div>
        </SuiteLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
