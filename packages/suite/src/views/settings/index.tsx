import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { H2 } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SUITE } from '@suite-actions/constants';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import {
    Section,
    ActionColumn,
    Row,
    TextColumn,
    ActionSelect,
    ActionButton,
} from '@suite-components/Settings';
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
                            <ActionButton onClick={() => console.log('fooo')} isDisabled={uiLocked}>
                                <Translation>{messages.TR_CONNECT_DROPBOX}</Translation>
                            </ActionButton>
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
