import { useState } from 'react';

import { selectFullSelectedAccount } from '@suite/account';
import { Translation, useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { selectIsLegacyLabelingVisible, selectLabelingValueBeingEdited } from '@suite/metadata';
import { SuiteSyncWalletDebug } from '@suite/suite-sync';
import { useWalletLabel } from '@suite/wallet';
import { selectDeviceThunk } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import {
    getAccountsByDeviceState,
    selectAccounts,
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { getAllAccounts } from '@suite-common/wallet-utils';
import {
    Box,
    Card,
    Collapsible,
    Column,
    Divider,
    Icon,
    IconButton,
    Row,
    TOOLTIP_DELAY_LONG,
    Text,
    Tooltip,
} from '@trezor/components';
import { AsteriskIcon, EjectIcon, XIcon } from '@trezor/icons';

import { redirectAfterWalletSelectedThunk } from 'src/actions/wallet/addWalletThunk';
import { WalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useSelector } from 'src/hooks/suite';
import { useStore } from 'src/hooks/suite/useStore';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';
import { type AcquiredDevice, type ForegroundAppProps } from 'src/types/suite';

import { EjectConfirmation } from './EjectConfirmation';

type WalletInstanceProps = {
    instance: AcquiredDevice;
    isSelected: boolean;
    index: number; // used only in data-test
    onCancel?: ForegroundAppProps['onCancel'];
};

export const WalletInstance = ({
    instance,
    isSelected,
    index,
    onCancel,
    ...rest
}: WalletInstanceProps) => {
    const [isEjecting, setIsEjecting] = useState(false);
    const accounts = useSelector(selectAccounts);
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const editing = useSelector(selectLabelingValueBeingEdited);
    const dispatch = useDispatch();
    const store = useStore();
    const { translationString } = useTranslation();
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const { defaultLabel, label } = useWalletLabel({ device: instance });

    const deviceAccounts = getAllAccounts(instance.state, accounts);

    const walletBalance = useTotalFiatBalance(deviceAccounts, baseCurrencyCode, currentFiatRates);

    const dataTestBase = `@switch-device/wallet-on-index/${index}`;

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
            const unfilteredUIAccountGroups = selectAllAccountsToList(store.getState());
            const currentFirstAccount = unfilteredUIAccountGroups[0];
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
            <Icon as={AsteriskIcon} size={12} />
        </Tooltip>
    );

    return (
        <Card
            key={`${instance.instance}${instance.state}`}
            paddingType="none"
            onClick={handleClick}
            tabIndex={0}
            data-testid={dataTestBase}
            isSelected={isSelected}
            {...rest}
        >
            <Box padding={{ vertical: 12, right: 12, left: 16 }}>
                <Collapsible isOpen={isEjecting}>
                    <Column gap={8} alignItems="flex-start">
                        <Row justifyContent="space-between" width="100%">
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
                                            defaultValue={defaultLabel}
                                            payload={{
                                                type: 'walletLabel',
                                                entityKey: instance.state.staticSessionId,
                                                defaultValue: instance.state.staticSessionId,
                                            }}
                                            leftAddon={passphraseIcon}
                                        >
                                            {label}
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
                                    icon={isEjecting ? XIcon : EjectIcon}
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setIsEjecting(prev => !prev);
                                    }}
                                    tooltip={{
                                        delayShow: TOOLTIP_DELAY_LONG,
                                        content: (
                                            <Translation
                                                id={
                                                    isEjecting
                                                        ? 'TR_CANCEL'
                                                        : 'TR_SWITCH_DEVICE_EJECT_TOOLTIP'
                                                }
                                            />
                                        ),
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
                        <Divider margin={{ vertical: 12 }} />
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
