import React, { useState } from 'react';
import { createTimeoutPromise } from '@trezor/utils';
import { Translation } from '@suite-components';
import { useSelector, useActions, useDispatch } from '@suite-hooks';
import { createCoinjoinAccount } from '@wallet-actions/coinjoinAccountActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as modalActions from '@suite-actions/modalActions';
import { Account, Network, NetworkSymbol } from '@wallet-types';
import { UnavailableCapabilities } from '@trezor/connect';
import { AddButton } from './AddButton';
import { isDesktop } from '@trezor/env-utils';
import { isDevEnv } from '@suite-common/suite-utils';
import { Dispatch } from '@suite-types';
import { RequestEnableTorResponse } from '@suite-components/modals/RequestEnableTor';
import { selectTorState } from '@suite-reducers/suiteReducer';

interface VerifyAvailabilityProps {
    coinjoinAccounts: Account[];
    symbol: NetworkSymbol;
    unavailableCapabilities?: UnavailableCapabilities;
}

const verifyAvailability = ({
    coinjoinAccounts,
    symbol,
    unavailableCapabilities,
}: VerifyAvailabilityProps) => {
    if (coinjoinAccounts.length > 0) {
        return <Translation id="MODAL_ADD_ACCOUNT_COINJOIN_LIMIT_EXCEEDED" />;
    }
    const capability = unavailableCapabilities?.coinjoin;
    if (capability === 'no-support') {
        return <Translation id="MODAL_ADD_ACCOUNT_COINJOIN_NO_SUPPORT" />;
    }
    // regtest coinjoin account enabled in web app for development
    if (!isDesktop() && !(isDevEnv && symbol === 'regtest')) {
        return <Translation id="MODAL_ADD_ACCOUNT_COINJOIN_DESKTOP_ONLY" />;
    }
    if (capability === 'update-required') {
        return <Translation id="MODAL_ADD_ACCOUNT_COINJOIN_UPDATE_REQUIRED" />;
    }
};

interface AddCoinjoinAccountProps {
    network: Network;
}

const requestEnableTorAction = () => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'request-enable-tor' }));

export const AddCoinjoinAccountButton = ({ network }: AddCoinjoinAccountProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const { isTorEnabled } = useSelector(selectTorState);
    const device = useSelector(state => state.suite.device);
    const accounts = useSelector(state => state.wallet.accounts);

    const action = useActions({
        createCoinjoinAccount,
        requestEnableTorAction,
        toggleTor: suiteActions.toggleTor,
    });

    const dispatch = useDispatch();

    if (!device) {
        return null;
    }

    const coinjoinAccounts = accounts.filter(
        a =>
            a.deviceState === device?.state &&
            a.symbol === network.symbol &&
            a.accountType === network.accountType,
    );

    const disabledMessage = verifyAvailability({
        coinjoinAccounts,
        symbol: network.symbol,
        unavailableCapabilities: device.unavailableCapabilities,
    });

    const onCreateCoinjoinAccountClick = async () => {
        const createAccount = async () => {
            await action.createCoinjoinAccount(network);
            setIsLoading(false);
        };

        setIsLoading(true);
        // Checking if Tor is enable and if not open modal to force the user to enable it to use coinjoin.
        // Tor only works in desktop so checking we are running desktop.
        if (!isTorEnabled && isDesktop()) {
            const continueWithTor = await action.requestEnableTorAction();
            if (continueWithTor === RequestEnableTorResponse.Back) {
                // Going back to the previous screen.
                dispatch(
                    modalActions.openModal({
                        type: 'add-account',
                        device,
                    }),
                );

                return;
            }
            if (continueWithTor === RequestEnableTorResponse.Skip) {
                await createAccount();
                return;
            }

            // Triggering Tor process and displaying Tor loading to give user feedback of Tor progress.
            action.toggleTor(true);
            const isTorLoaded = await dispatch(
                modalActions.openDeferredModal({ type: 'tor-loading' }),
            );
            // When Tor was not loaded it means there was an error or user canceled it, stop the coinjoin account activation.
            if (!isTorLoaded) return;
        }
        await createTimeoutPromise(1000); // TODO fix properly: https://github.com/trezor/trezor-suite/issues/6902
        await createAccount();
    };

    return (
        <AddButton
            disabledMessage={disabledMessage}
            handleClick={onCreateCoinjoinAccountClick}
            isLoading={isLoading}
        />
    );
};
