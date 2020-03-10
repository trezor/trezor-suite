import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Translation } from '@suite-components';
import { SettingsLayout } from '@settings-components';
import {
    Section,
    ActionColumn,
    Row,
    TextColumn,
    ActionSelect,
    ActionButton,
    Analytics,
} from '@suite-components/Settings';
import { AppState, Dispatch } from '@suite-types';
import { FIAT, LANGUAGES } from '@suite-config';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as languageActions from '@settings-actions/languageActions';

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
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setLocalCurrency: bindActionCreators(walletSettingsActions.setLocalCurrency, dispatch),
    fetchLocale: bindActionCreators(languageActions.fetchLocale, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const BottomContainer = styled.div`
    margin-top: auto;
`;

const Settings = ({ locks, wallet, language, setLocalCurrency, fetchLocale }: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);

    return (
        <SettingsLayout>
            <Section header={<Translation id="TR_LANGUAGE" />}>
                <Row>
                    <TextColumn title={<Translation id="TR_LANGUAGE" />} />
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

            <Section header={<Translation id="TR_CURRENCY" />}>
                <Row>
                    <TextColumn title={<Translation id="TR_PRIMARY_FIAT" />} />
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

            {/* TODO: KEEP IT HERE AND UNCOMMENT WHEN READY */}
            {/* <Section header={<Translation id="TR_LABELING" />}>
                <Row>
                    <TextColumn title={<Translation id="TR_CONNECT_DROPBOX} />" />
                    <ActionColumn>
                        <ActionButton
                            onClick={() => console.log('fooo')}
                            isDisabled={uiLocked}
                            variant="secondary"
                        >
                            <Translation id="TR_CONNECT_DROPBOX" />
                        </ActionButton>
                    </ActionColumn>
                </Row>
            </Section> */}

            <Analytics />

            <BottomContainer>
                <Section borderless>
                    <Row>
                        <TextColumn
                            title={<Translation id="TR_SUITE_VERSION" />}
                            description={<Translation id="TR_YOUR_CURRENT_VERSION" />}
                        />
                        <ActionColumn>
                            <ActionButton
                                onClick={() => console.log('moo')}
                                isDisabled={uiLocked}
                                variant="secondary"
                            >
                                <Translation id="TR_CHECK_FOR_UPDATES" />
                            </ActionButton>
                        </ActionColumn>
                    </Row>
                </Section>
            </BottomContainer>
        </SettingsLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
