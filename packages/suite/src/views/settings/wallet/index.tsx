import React from 'react';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Switch } from '@trezor/components-v2';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import { Props } from './Container';
import { Section, ActionColumn, Row, TextColumn } from '@suite-components/Settings';

const WalletSettings = (props: Props) => (
    <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
        <div style={{ padding: '30px' }}>
            <Section header="???">
                <Row>
                    <TextColumn
                        title={<Translation {...messages.TR_HIDE_BALANCE} />}
                        description={<Translation {...messages.TR_HIDE_BALANCE_EXPLAINED} />}
                    />
                    <ActionColumn>
                        <Switch
                            onChange={(checked: boolean) => {
                                props.setHideBalance(checked);
                            }}
                            checked={props.wallet.settings.hideBalance}
                        />
                    </ActionColumn>
                </Row>
            </Section>
        </div>
    </SuiteLayout>
);

export default WalletSettings;
