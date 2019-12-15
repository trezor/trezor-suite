import React from 'react';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import { Props } from './Container';
import { Section } from '@suite-components/Settings';

const WalletSettings = (props: Props) => (
    <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
        <div style={{ padding: '30px' }}>
            <Section
                header="???"
                rows={[
                    {
                        left: [
                            {
                                type: 'description',
                                value: <Translation {...messages.TR_HIDE_BALANCE} />,
                            },
                            {
                                type: 'small-description',
                                value: <Translation {...messages.TR_HIDE_BALANCE_EXPLAINED} />,
                            },
                        ],
                        right: [
                            {
                                type: 'switch',
                                props: {
                                    onChange: (checked: boolean) => {
                                        props.setHideBalance(checked);
                                    },
                                    checked: props.wallet.settings.hideBalance,
                                },
                            },
                        ],
                    },
                ]}
            />
        </div>
    </SuiteLayout>
);

export default WalletSettings;
