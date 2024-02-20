import { useState } from 'react';

import { createTimeoutPromise } from '@trezor/utils';
import { UnavailableCapabilities } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { isDevEnv } from '@suite-common/suite-utils';
import { RequestEnableTorResponse } from '@suite-common/suite-config';
import { selectDevice } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { createCoinjoinAccount } from 'src/actions/wallet/coinjoinAccountActions';
import { toggleTor } from 'src/actions/suite/suiteActions';
import { openDeferredModal, openModal } from 'src/actions/suite/modalActions';
import { Account, Network, NetworkSymbol } from 'src/types/wallet';
import { selectTorState } from 'src/reducers/suite/suiteReducer';

import { AddButton } from './AddButton';

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

export const AddCoinjoinAccountButton = ({ network }: AddCoinjoinAccountProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const { isTorEnabled } = useSelector(selectTorState);
    const device = useSelector(selectDevice);
    const accounts = useSelector(state => state.wallet.accounts);
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
            await dispatch(createCoinjoinAccount(network));
            setIsLoading(false);
        };

        setIsLoading(true);
        // Checking if Tor is enable and if not open modal to force the user to enable it to use coinjoin.
        // Tor only works in desktop so checking we are running desktop.
        if (!isTorEnabled && isDesktop()) {
            const continueWithTor = await dispatch(
                openDeferredModal({ type: 'request-enable-tor' }),
            );
            if (continueWithTor === RequestEnableTorResponse.Back) {
                // Going back to the previous screen.
                dispatch(
                    openModal({
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
            dispatch(toggleTor(true));
            const isTorLoaded = await dispatch(openDeferredModal({ type: 'tor-loading' }));
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
            networkName={network.name}
        />
    );
};
