import { useState } from 'react';

import {
    getAccountsByDeviceState,
    selectCurrentFiatRates,
    selectDeviceThunk,
    selectLocalCurrency,
} from '@suite-common/wallet-core';
import { getAllAccounts } from '@suite-common/wallet-utils';
import { Box, Card, Column, Divider, Icon, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { METADATA_LABELING } from 'src/actions/suite/constants';
import { redirectAfterWalletSelectedThunk } from 'src/actions/wallet/addWalletThunk';
import { MetadataLabeling, Translation, WalletLabeling } from 'src/components/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';
import { AcquiredDevice, ForegroundAppProps } from 'src/types/suite';

import { EjectConfirmation } from './EjectConfirmation';
import { useWalletLabeling } from '../../../../components/suite/labeling/WalletLabeling';

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
    const [isEjectVisible, setIsEjectVisible] = useState(false);
    const accounts = useSelector(state => state.wallet.accounts);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const editing = useSelector(state => state.metadata.editing);
    const dispatch = useDispatch();

    const { defaultAccountLabelString } = useWalletLabeling();

    const deviceAccounts = getAllAccounts(instance.state, accounts);

    const walletBalance = useTotalFiatBalance(deviceAccounts, localCurrency, currentFiatRates);

    const { walletLabel } = useSelector(state =>
        selectLabelingDataForWallet(state, instance.state),
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

            // NOTE: attempt to determine, if the currently selected account
            // has a corresponding account in the next device accounts
            // if not, enforce switching URL to dashboard
            const nextAccount = nextDeviceAccounts.find(
                account =>
                    account.symbol === selectedAccount.params?.symbol &&
                    account.index === selectedAccount.params?.accountIndex &&
                    account.accountType === selectedAccount.params?.accountType &&
                    // NOTE: do not switch to empty accounts, but only if the current account is first or all accounts are empty
                    (!account.empty ||
                        (selectedAccount.params.accountIndex === 0 &&
                            nextDeviceAccounts.every(account => account.empty))),
            );

            dispatch(selectDeviceThunk({ device: instance }));
            dispatch(redirectAfterWalletSelectedThunk({ forceDeviceDashboard: !nextAccount }));
            onCancel?.(false);
        }
    };

    return (
        <Box position={{ type: 'relative' }}>
            <Card
                key={`${instance.instance}${instance.state}`}
                paddingType="small"
                onClick={handleClick}
                tabIndex={0}
                data-testid={dataTestBase}
                variant={isSelected ? 'primary' : undefined}
                onMouseEnter={() => setIsEjectVisible(true)}
                onMouseLeave={() => setIsEjectVisible(false)}
                {...rest}
            >
                <Column>
                    <Text
                        as="div"
                        variant={isSelected ? 'default' : 'tertiary'}
                        typographyStyle={isSelected ? 'highlight' : 'body'}
                        ellipsisLineCount={1}
                    >
                        <Row justifyContent="space-between">
                            <Row gap={spacings.xxs}>
                                {!instance.useEmptyPassphrase && (
                                    <Tooltip
                                        content={<Translation id="TR_WALLET_PASSPHRASE_WALLET" />}
                                    >
                                        <Icon name="asterisk" size={12} />
                                    </Tooltip>
                                )}
                                {instance.state?.staticSessionId ? (
                                    <MetadataLabeling
                                        defaultVisibleValue={
                                            walletLabel === undefined || walletLabel.trim() === ''
                                                ? defaultWalletLabel
                                                : walletLabel
                                        }
                                        payload={{
                                            type: 'walletLabel',
                                            entityKey: instance.state.staticSessionId,
                                            defaultValue: instance.state.staticSessionId,
                                            value: instance?.metadata[
                                                METADATA_LABELING.ENCRYPTION_VERSION
                                            ]
                                                ? walletLabel
                                                : '',
                                        }}
                                        defaultEditableValue={defaultWalletLabel}
                                    />
                                ) : (
                                    <WalletLabeling device={instance} />
                                )}
                            </Row>
                            {(isEjectVisible || isEjecting) && (
                                <Box
                                    position={{
                                        type: 'absolute',
                                        right: spacings.sm,
                                        top: spacings.sm,
                                    }}
                                >
                                    <Tooltip
                                        cursor="pointer"
                                        content={<Translation id="TR_EJECT_HEADING" />}
                                    >
                                        <Icon
                                            data-testid={`${dataTestBase}/eject-button`}
                                            name="eject"
                                            size={22}
                                            variant="tertiary"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setIsEjecting(true);
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                            )}
                        </Row>
                    </Text>

                    <FiatHeader
                        amount={walletBalance}
                        size="medium"
                        localCurrency={localCurrency}
                        data-testid={`${dataTestBase}/fiat-amount`}
                    />
                </Column>

                {isEjecting && (
                    <>
                        <Divider />
                        <EjectConfirmation
                            instance={instance}
                            onClick={stopPropagation}
                            onCancel={onEjectCancelClick}
                        />
                    </>
                )}
            </Card>
        </Box>
    );
};
