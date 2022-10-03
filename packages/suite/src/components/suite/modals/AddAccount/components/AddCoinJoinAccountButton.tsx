import React from 'react';
import { Translation } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import { useDispatch } from 'react-redux';
import { createCoinjoinAccount } from '@wallet-actions/coinjoinAccountActions';
import * as modalActions from '@suite-actions/modalActions';
import type { Network } from '@wallet-types';
import { AddButton } from './AddButton';
import { getIsTorEnabled } from '@suite-utils/tor';
import { isDesktop } from '@suite-utils/env';
import { desktopApi } from '@trezor/suite-desktop-api';

interface AddCoinJoinAccountProps {
    network: Network;
}

export const AddCoinJoinAccountButton = ({ network }: AddCoinJoinAccountProps) => {
    const isTorEnabled = useSelector(state => getIsTorEnabled(state.suite.torStatus));

    const action = useActions({ createCoinjoinAccount });
    const dispatch = useDispatch();
    const { device, accounts } = useSelector(state => ({
        device: state.suite.device,
        accounts: state.wallet.accounts,
    }));

    if (!device) {
        return null;
    }

    const coinjoinAccounts = accounts.filter(
        a =>
            a.deviceState === device?.state &&
            a.symbol === network.symbol &&
            a.accountType === network.accountType,
    );

    // TODO: more disabled button states
    // no-capability, device connected etc

    const goBackToAddAccount = () =>
        dispatch(
            modalActions.openModal({
                type: 'add-account',
                device,
            }),
        );

    const onCreateCoinjoinAccountClick = async () => {
        const accessCoinjoinAccount = await dispatch(
            modalActions.openDeferredModal({ type: 'access-coinjoin-account' }),
        );
        if (!accessCoinjoinAccount) {
            return goBackToAddAccount();
        }

        // Checking if Tor is enable and if not open modal to force the user to enable it to use coinjoin.
        // TODO: if the current network is regtest or testnet we could ignore this to make faster developer experience.
        // const isDevNetwork = ['regtest', 'test'].includes(network.symbol);
        // Tor only works in desktop so checking we are running desktop.
        if (!isTorEnabled && isDesktop()) {
            const continueWithTor = await dispatch(
                modalActions.openDeferredModal({ type: 'request-enable-tor' }),
            );
            if (!continueWithTor) {
                return goBackToAddAccount();
            }

            // Triggering Tor process and displaying Tor loading to give user feedback of Tor progress.
            desktopApi.toggleTor(true);
            const isTorLoaded = await dispatch(
                modalActions.openDeferredModal({ type: 'tor-loading' }),
            );
            // When Tor was not loaded it means there was an error or user canceled it, stop the coinjoin account activation.
            if (!isTorLoaded) return;
        }
        action.createCoinjoinAccount(network, 80);
    };

    const isDisabled = coinjoinAccounts.length > 0;
    return (
        <AddButton
            disabledMessage={
                isDisabled ? <Translation id="MODAL_ADD_ACCOUNT_LIMIT_EXCEEDED" /> : null
            }
            handleClick={onCreateCoinjoinAccountClick}
        />
    );
};
