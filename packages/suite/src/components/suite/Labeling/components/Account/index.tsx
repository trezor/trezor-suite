import React from 'react';
import styled from 'styled-components';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as deviceUtils from '@suite-utils/device';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { Props } from './Container';
import WalletLabel from '../Wallet';

const TabularNums = styled.span`
    font-variant-numeric: tabular-nums;
`;

export default (props: Props) => {
    const { device, labeling } = props;
    const accounts = !Array.isArray(props.account) ? [props.account] : props.account;
    if (accounts.length < 1) return null;

    const key = `account:${accounts[0].descriptor}`;
    let accountLabel: JSX.Element;
    if (labeling[key]) {
        accountLabel = <span>{labeling[key]}</span>;
    } else if (accounts[0].accountType !== 'normal') {
        accountLabel = (
            <Translation
                id="LABELING_ACCOUNT_WITH_TYPE"
                values={{
                    index: accounts[0].index + 1,
                    type:
                        accounts[0].accountType === 'segwit'
                            ? messages.TR_ACCOUNT_TYPE_SEGWIT
                            : messages.TR_ACCOUNT_TYPE_LEGACY,
                }}
            />
        );
    } else {
        accountLabel = (
            <Translation
                id="LABELING_ACCOUNT"
                values={{
                    index: accounts[0].index + 1,
                }}
            />
        );
    }

    if (device && !accounts.find(a => a.deviceState === device.state)) {
        // account is not associated with selected device, add wallet label
        const accountDevice = accountUtils.findAccountDevice(accounts[0], props.devices);
        if (accountDevice) {
            return (
                <>
                    <WalletLabel
                        device={accountDevice}
                        useDeviceLabel={!deviceUtils.isSelectedDevice(device, accountDevice)}
                    />{' '}
                    <TabularNums>{accountLabel}</TabularNums>
                </>
            );
        }
    }

    return <TabularNums>{accountLabel}</TabularNums>;
};
