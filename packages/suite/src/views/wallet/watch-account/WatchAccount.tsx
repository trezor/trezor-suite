import { useEffect, useState } from 'react';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation, type TranslationKey } from '@suite/intl';
import { type WatchAccountParams, gotoThunk, selectRouterParams } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { canAddWatchOnlyAccount } from '@suite-common/wallet-utils';
import { Button, Card, Column, Paragraph } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { addWatchOnlyAccountThunk } from '#src/actions/wallet/watchOnlyAccountThunks';
import { WatchOnlyAddressInput } from '#src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/WatchOnlyAddressInput';
import { useWatchOnlyAddressInput } from '#src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/useWatchOnlyAddressInput';
import { useSelector } from '#src/hooks/suite/useSelector';

const Notice = ({ id, values }: { id: TranslationKey; values?: Record<string, string> }) => (
    <Card>
        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
            <Translation id={id} values={values} />
        </Paragraph>
    </Card>
);

const goToAccount = (
    symbol: NetworkSymbol,
    accountIndex: Account['index'],
    accountType: Account['accountType'],
) => gotoThunk({ routeName: 'wallet-index', params: { symbol, accountIndex, accountType } });

type WatchAccountFormProps = WatchAccountParams & {
    device: NonNullable<ReturnType<typeof selectSelectedDevice>>;
};

const WatchAccountForm = ({ symbol, address, device }: WatchAccountFormProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isAdding, setIsAdding] = useState(false);
    const deviceState = device.state?.staticSessionId;
    const addressInput = useWatchOnlyAddressInput(symbol, deviceState, address);
    const watchedAccount = addressInput.existingAccount;

    // The link may point to an address this wallet already has, so it just opens that account.
    // Primitives, so a balance update of the found account doesn't navigate again.
    const watchedAccountIndex = watchedAccount?.index;
    const watchedAccountType = watchedAccount?.accountType;
    useEffect(() => {
        if (watchedAccountIndex === undefined || watchedAccountType === undefined) return;

        dispatch(goToAccount(symbol, watchedAccountIndex, watchedAccountType));
    }, [dispatch, symbol, watchedAccountIndex, watchedAccountType]);

    const startWatching = async () => {
        if (!addressInput.address) return;

        setIsAdding(true);
        const addedAccount = await dispatch(
            addWatchOnlyAccountThunk({ address: addressInput.address, symbol, device }),
        )
            .unwrap()
            .finally(() => setIsAdding(false));
        if (addedAccount) {
            dispatch(goToAccount(symbol, addedAccount.index, addedAccount.accountType));
        }
    };

    return (
        <Card>
            <Column gap={16} alignItems="stretch">
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation
                        id="TR_ACCOUNT_TYPE_WATCH_ONLY_DESC"
                        values={{ value: getNetwork(symbol).name }}
                    />
                </Paragraph>
                <WatchOnlyAddressInput state={addressInput} />
                <Column alignItems="flex-end">
                    <Button
                        onClick={startWatching}
                        isDisabled={!addressInput.address}
                        isLoading={isAdding}
                        data-testid="@watch-account/start-watching"
                    >
                        <Translation id="TR_START_WATCHING" />
                    </Button>
                </Column>
            </Column>
        </Card>
    );
};

export const WatchAccount = () => {
    const params = useSelector(selectRouterParams) as Partial<WatchAccountParams> | undefined;
    const isDebugModeEnabled = useSelector(selectIsDebugModeActive);
    const device = useSelector(selectSelectedDevice);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const symbol = params?.symbol;
    const address = params?.address;

    if (!isDebugModeEnabled) return <Notice id="TR_WATCH_ACCOUNT_DEBUG_ONLY" />;

    if (!symbol || !address) return <Notice id="TR_WATCH_ACCOUNT_INVALID_LINK" />;

    const network = getNetwork(symbol);

    if (!canAddWatchOnlyAccount(network.networkType, isDebugModeEnabled)) {
        return (
            <Notice id="TR_WATCH_ACCOUNT_UNSUPPORTED_NETWORK" values={{ network: network.name }} />
        );
    }

    if (!device?.state?.staticSessionId) return <Notice id="TR_WATCH_ACCOUNT_SELECT_WALLET" />;

    if (!enabledNetworks.includes(symbol)) {
        return <Notice id="TR_WATCH_ACCOUNT_ENABLE_NETWORK" values={{ network: network.name }} />;
    }

    // Keyed so following another watch link starts from its own address.
    return (
        <WatchAccountForm
            key={`${symbol}/${address}`}
            symbol={symbol}
            address={address}
            device={device}
        />
    );
};
