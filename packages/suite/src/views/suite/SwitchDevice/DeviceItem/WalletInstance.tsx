import { useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { selectIsLegacyLabelingVisible, selectLabelingDataForWallet } from '@suite/metadata';
import { SuiteSyncWalletDebug } from '@suite/suite-sync';
import { selectIsSuiteSyncEnabled, selectSuiteSyncWalletLabel } from '@suite-common/suite-sync';
import {
    getAccountsByDeviceState,
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { getAllAccounts, parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import {
    Box,
    Card,
    Collapsible,
    Column,
    Divider,
    Icon,
    IconButton,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { redirectAfterWalletSelectedThunk } from 'src/actions/wallet/addWalletThunk';
import { WalletLabeling } from 'src/components/suite';
import { Labeling } from 'src/components/suite/labeling/Labeling/Labeling';
import { useWalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useStore } from 'src/hooks/suite/useStore';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';
import { type AcquiredDevice, type AppState, type ForegroundAppProps } from 'src/types/suite';

import { EjectConfirmation } from './EjectConfirmation';

type WalletInstanceProps = {
    instance: AcquiredDevice;
    isSelected: boolean;
    index: number; // used only in data-test
    onCancel?: ForegroundAppProps['onCancel'];
};

const selectCombinedWalletLabel =
    ({ deviceStaticSessionId }: { deviceStaticSessionId: StaticSessionId | null }) =>
    (state: AppState): string | null => {
        if (!deviceStaticSessionId) return null;

        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

        if (isSuiteSyncEnabled) {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

            return selectSuiteSyncWalletLabel(state, walletDescriptor);
        }

        const isLegacyLabelingVisible = selectIsLegacyLabelingVisible(state);

        if (isLegacyLabelingVisible) {
            const legacyLabel = selectLabelingDataForWallet(
                state,
                deviceStaticSessionId,
            ).walletLabel;

            return legacyLabel === undefined || legacyLabel.trim() === '' ? null : legacyLabel;
        }

        return null;
    };

export const WalletInstance = ({
    instance,
    isSelected,
    index,
    onCancel,
    ...rest
}: WalletInstanceProps) => {
    const [isEjecting, setIsEjecting] = useState(false);
    const accounts = useSelector(state => state.wallet.accounts);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const editing = useSelector(state => state.metadata.editing);
    const dispatch = useDispatch();
    const store = useStore();
    const { translationString } = useTranslation();

    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const { defaultAccountLabelString } = useWalletLabeling();

    const deviceAccounts = getAllAccounts(instance.state, accounts);

    const walletBalance = useTotalFiatBalance(deviceAccounts, baseCurrencyCode, currentFiatRates);

    const walletLabel = useSelector(
        selectCombinedWalletLabel({
            deviceStaticSessionId: instance?.state?.staticSessionId ?? null,
        }),
    );

    const dataTestBase = `@switch-device/wallet-on-index/${index}`;

    const defaultWalletLabel = defaultAccountLabelString({ device: instance });

    const stopPropagation = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation();

    const onEjectCancelClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setIsEjecting(false);
        e.stopPropagation();
    };

    const handleClick = () => {
        if (!editing) {
            const nextDeviceAccounts = instance.state
                ? getAccountsByDeviceState(accounts, instance.state)
                : [];

            // NOTE: to determine which account is the first one, we need to filter out empty accounts
            // that are currently displayed in the UI
            const unfilteredUIAccounGroups = selectAllAccountsToList(store.getState());
            const currentFirstAccount = unfilteredUIAccounGroups[0];
            // NOTE: attempt to determine, if the currently selected account
            // has a corresponding account in the next wallet accounts
            // if not, enforce switching URL to dashboard
            const nextAccount = nextDeviceAccounts.find(
                account =>
                    account.symbol === selectedAccount.params?.symbol &&
                    account.index === selectedAccount.params?.accountIndex &&
                    account.accountType === selectedAccount.params?.accountType &&
                    // NOTE: do not switch to empty accounts, unless the current account is first and all other accounts in the next wallet are empty
                    (!account.empty ||
                        (selectedAccount.account &&
                            selectedAccount.account?.descriptor ===
                                currentFirstAccount?.descriptor &&
                            nextDeviceAccounts.every(account => account.empty))),
            );

            dispatch(selectDeviceThunk({ device: instance }));
            dispatch(redirectAfterWalletSelectedThunk({ forceDeviceDashboard: !nextAccount }));
            onCancel?.(false);
        }
    };

    const passphraseIcon = instance.useEmptyPassphrase === false && (
        <Tooltip content={<Translation id="TR_WALLET_PASSPHRASE_WALLET" />}>
            <Icon name="asterisk" size={12} />
        </Tooltip>
    );

    return (
        <Card
            key={`${instance.instance}${instance.state}`}
            paddingType="none"
            onClick={handleClick}
            tabIndex={0}
            data-testid={dataTestBase}
            variant={isSelected ? 'primary' : undefined}
            {...rest}
        >
            <Box padding={{ vertical: 12, right: 12, left: 16 }}>
                <Collapsible isOpen={isEjecting}>
                    <Column gap={8}>
                        <Row justifyContent="space-between">
                            <Text
                                as="div"
                                intent="neutral"
                                priority={isSelected ? 'primary' : 'secondary'}
                                typographyStyle={isSelected ? 'body-md-strong' : 'body-md'}
                            >
                                {instance.state?.staticSessionId ? (
                                    <Column>
                                        <Labeling
                                            placeholder={translationString(
                                                'TR_LABELING_WALLET_LABEL',
                                            )}
                                            maxWidth={290}
                                            deviceStaticSessionId={instance.state.staticSessionId}
                                            defaultValue={defaultWalletLabel}
                                            payload={{
                                                type: 'walletLabel',
                                                entityKey: instance.state.staticSessionId,
                                                defaultValue: instance.state.staticSessionId,
                                                value: walletLabel ?? undefined,
                                            }}
                                            leftAddon={passphraseIcon}
                                        >
                                            {walletLabel ?? defaultWalletLabel}
                                        </Labeling>
                                        <SuiteSyncWalletDebug
                                            device={instance}
                                            isLegacyLabelingVisible={isLegacyLabelingVisible}
                                        />
                                    </Column>
                                ) : (
                                    <Row gap={4}>
                                        {passphraseIcon}
                                        <WalletLabeling device={instance} />
                                    </Row>
                                )}
                            </Text>
                            <Collapsible.Toggle>
                                <IconButton
                                    data-testid={
                                        isEjecting
                                            ? `@switch-device/cancelEject`
                                            : `${dataTestBase}/eject-button`
                                    }
                                    icon={isEjecting ? 'x' : 'eject'}
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setIsEjecting(prev => !prev);
                                    }}
                                />
                            </Collapsible.Toggle>
                        </Row>

                        <FiatHeader
                            amount={walletBalance}
                            size="medium"
                            localCurrency={baseCurrencyCode}
                            data-testid={`${dataTestBase}/fiat-amount`}
                        />
                    </Column>

                    <Collapsible.Content>
                        <Divider margin={{ vertical: spacings.sm }} />
                        <EjectConfirmation
                            instance={instance}
                            onClick={stopPropagation}
                            onCancel={onEjectCancelClick}
                        />
                    </Collapsible.Content>
                </Collapsible>
            </Box>
        </Card>
    );
};
