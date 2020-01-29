import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { H2, Switch } from '@trezor/components-v2';

import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SUITE } from '@suite-actions/constants';
import { SuiteLayout } from '@suite-components';
import { Menu as SettingsMenu } from '@settings-components';
import {
    Section,
    ActionColumn,
    Row,
    TextColumn,
    ActionSelect,
    ActionButton,
} from '@suite-components/Settings';
import { AppState, Dispatch } from '@suite-types';
import { FIAT, LANGUAGES } from '@suite-config';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as languageActions from '@settings-actions/languageActions';
import * as analyticsActions from '@suite-actions/analyticsActions';

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
    language: state.suite.language,
    analytics: state.suite.analytics,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setLocalCurrency: bindActionCreators(walletSettingsActions.setLocalCurrency, dispatch),
    fetchLocale: bindActionCreators(languageActions.fetchLocale, dispatch),
    toggleAnalytics: bindActionCreators(analyticsActions.toggleAnalytics, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const BottomContainer = styled.div`
    margin-top: auto;
`;

const Settings = ({
    locks,
    wallet,
    language,
    analytics,
    setLocalCurrency,
    fetchLocale,
    toggleAnalytics,
}: Props) => {
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
                <H2>
                    <Translation {...messages.TR_GENERAL} />
                </H2>

                <Section header={<Translation>{messages.TR_LANGUAGE}</Translation>}>
                    <Row>
                        <TextColumn title={<Translation>{messages.TR_LANGUAGE}</Translation>} />
                        <ActionColumn>
                            <ActionSelect
                                value={{
                                    value: language,
                                    // sorry for ! but dont know how to force typescript to stay calm
                                    label: LANGUAGES.find(l => l.code === language)!.name,
                                }}
                                options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))}
                                // todo: Select should preserve type information
                                onChange={(option: {
                                    value: typeof LANGUAGES[number]['code'];
                                    label: typeof LANGUAGES[number]['name'];
                                }) => fetchLocale(option.value)}
                            />
                        </ActionColumn>
                    </Row>
                </Section>

                <Section header={<Translation>{messages.TR_CURRENCY}</Translation>}>
                    <Row>
                        <TextColumn title={<Translation>{messages.TR_PRIMARY_FIAT}</Translation>} />
                        <ActionColumn>
                            <ActionSelect
                                onChange={(option: { value: string; label: string }) =>
                                    setLocalCurrency(option.value)
                                }
                                value={buildCurrencyOption(wallet.settings.localCurrency)}
                                options={FIAT.currencies.map(c => buildCurrencyOption(c))}
                                isDisabled={uiLocked}
                            />
                        </ActionColumn>
                    </Row>
                </Section>

                <Section header={<Translation>{messages.TR_LABELING}</Translation>}>
                    <Row>
                        <TextColumn
                            title={<Translation>{messages.TR_CONNECT_DROPBOX}</Translation>}
                        />
                        <ActionColumn>
                            <ActionButton
                                onClick={() => console.log('fooo')}
                                isDisabled={uiLocked}
                                variant="secondary"
                            >
                                <Translation>{messages.TR_CONNECT_DROPBOX}</Translation>
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                </Section>

                <Section borderless>
                    <Row>
                        <TextColumn
                            title={<Translation>{messages.TR_ALLOW_ANALYTICS}</Translation>}
                            description={
                                <Translation>{messages.TR_ALLOW_ANALYTICS_DESCRIPTION}</Translation>
                            }
                            learnMore="todo some link"
                        />
                        <ActionColumn>
                            <Switch
                                checked={analytics}
                                onChange={toggleAnalytics}
                                // todo: does not work (components)
                                // isDisabled={uiLocked}
                            />
                        </ActionColumn>
                    </Row>
                </Section>

                <BottomContainer>
                    <Section borderless>
                        <Row>
                            <TextColumn
                                title={<Translation>{messages.TR_SUITE_VERSION}</Translation>}
                                description={
                                    <Translation>{messages.TR_YOUR_CURRENT_VERSION}</Translation>
                                }
                            />
                            <ActionColumn>
                                <ActionButton
                                    onClick={() => console.log('moo')}
                                    isDisabled={uiLocked}
                                    variant="secondary"
                                >
                                    <Translation>{messages.TR_CHECK_FOR_UPDATES}</Translation>
                                </ActionButton>
                            </ActionColumn>
                        </Row>
                    </Section>
                </BottomContainer>
            </div>
        </SuiteLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
