import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type SelectedAccountRootState } from '@suite/account';
import { Address } from '@suite/address';
import { ReadMoreLink } from '@suite/external-links';
import { Translation, useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import {
    type MetadataRootState,
    selectIsLegacyLabelingVisible,
    selectLabelingDataForSelectedAccount,
} from '@suite/metadata';
import { getFirstFreshAddress } from '@suite-common/address';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    type WithSuiteSyncState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncAddressLabels,
} from '@suite-common/suite-sync';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import {
    Banner,
    Button,
    type ButtonProps,
    Card,
    H4,
    InfoItem,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { showAddressThunk } from './showAddressThunk';
import { useReceiveDisabled } from './useReceiveDisabled';

const TooltipLabel = ({
    symbol,
    multipleAddresses,
    accountType,
}: {
    symbol: string;
    multipleAddresses: boolean;
    accountType: string;
}) => {
    const addressLabel = (
        <H4 intent="neutral" priority="secondary" typographyStyle="body-sm">
            <Translation id={multipleAddresses ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS'} />
        </H4>
    );

    if (symbol === 'ltc' && accountType === 'segwit') {
        // additional tooltip with LTC addresses explanation
        return (
            <Tooltip
                hasIcon
                content={<ReadMoreLink message="TR_LTC_ADDRESS_INFO" url="LTC_ADDRESS_INFO_URL" />}
            >
                {addressLabel}
            </Tooltip>
        );
    }
    if (symbol === 'bch') {
        // additional tooltip with BCH addresses explanation
        return (
            <Tooltip
                hasIcon
                content={
                    <ReadMoreLink message="TR_BCH_ADDRESS_INFO" url="HELP_CENTER_CASHADDR_URL" />
                }
            >
                {addressLabel}
            </Tooltip>
        );
    }

    return addressLabel;
};

export interface FreshAddressProps {
    account: Account;
    alreadyUsedAddresses: ReceiveInfo[];
    disabled: boolean;
    locked: boolean;
    pendingAddresses: string[];
    isDeviceConnected: boolean;
}

export const FreshAddress = ({
    account,
    alreadyUsedAddresses,
    disabled,
    pendingAddresses,
    locked,
    isDeviceConnected,
}: FreshAddressProps) => {
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, account.key),
    );

    const isLegacyLabelingVisible = useSelector(
        (state: MetadataRootState & WithSuiteSyncState & MessageSystemRootState) =>
            selectIsLegacyLabelingVisible(state),
    );

    const { addressLabels } = useSelector((state: MetadataRootState & SelectedAccountRootState) =>
        selectLabelingDataForSelectedAccount(state),
    );

    const isSuiteSyncEnabled = useSelector(
        (state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
            selectIsSuiteSyncEnabled(state),
    );

    const suiteSyncAddressLabels = useSelector((state: SuiteSyncDataRootState) =>
        isSuiteSyncEnabled ? selectSuiteSyncAddressLabels(state, account.deviceState) : [],
    );

    const { isReceiveDisabled, receiveDisabledTooltipContent } = useReceiveDisabled();
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const firstFreshAddress = useMemo(
        () =>
            getFirstFreshAddress(
                account,
                alreadyUsedAddresses,
                pendingAddresses,
                isAccountUtxoBased,
            ),
        [account, alreadyUsedAddresses, pendingAddresses, isAccountUtxoBased],
    );

    // On coinjoin account, disallow to reveal more than the first receive address until it is used,
    // because discovery of coinjoin account relies on assumption that user uses his first address first.
    const coinjoinDisallowReveal =
        account.accountType === 'coinjoin' &&
        !account.addresses?.used.length &&
        firstFreshAddress?.address !== account.addresses?.unused[0]?.address;

    const handleAddressReveal = () => {
        if (firstFreshAddress) {
            dispatch(
                showAddressThunk({
                    path: firstFreshAddress.path,
                    address: firstFreshAddress.address,
                }),
            );
        }
    };

    const buttonTooltipContent = () => {
        if (coinjoinDisallowReveal) {
            return <Translation id="RECEIVE_ADDRESS_COINJOIN_DISALLOW" />;
        }
        if (!firstFreshAddress) {
            return <Translation id="RECEIVE_ADDRESS_LIMIT_REACHED" />;
        }
        if (receiveDisabledTooltipContent !== null) {
            return receiveDisabledTooltipContent;
        }

        return null;
    };

    const buttonRevealAddressProps: Partial<ButtonProps> = {
        'data-testid': '@wallet/receive/reveal-address-button',
        onClick: handleAddressReveal,
        isDisabled:
            disabled || locked || coinjoinDisallowReveal || !firstFreshAddress || isReceiveDisabled,
        isLoading: locked,
        minWidth: 220,
        size: 'large',
    };
    const firstFreshAddressLabel = firstFreshAddress?.address
        ? (suiteSyncAddressLabels.find(it => it.address === firstFreshAddress.address)?.label ??
          (isLegacyLabelingVisible ? addressLabels[firstFreshAddress.address] : undefined))
        : undefined;

    return (
        <Card>
            <Row gap={spacings.lg} flexWrap="wrap">
                <InfoItem
                    label={
                        <TooltipLabel
                            multipleAddresses={isAccountUtxoBased}
                            symbol={account.symbol}
                            accountType={account.accountType}
                        />
                    }
                    flex="1"
                >
                    <Text typographyStyle="headline-md">
                        {firstFreshAddress?.address ? (
                            <Labeling
                                payload={{
                                    type: 'addressLabel',
                                    entityKey: account.key,
                                    defaultValue: firstFreshAddress.address,
                                    networkSymbol: account.symbol,
                                    accountDescriptor: account.descriptor,
                                    value: firstFreshAddressLabel,
                                }}
                                deviceStaticSessionId={account.deviceState}
                                displayValue={
                                    <Address value={firstFreshAddress.address} isTruncated />
                                }
                                placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
                                minHeight={28}
                            >
                                {firstFreshAddressLabel}
                            </Labeling>
                        ) : (
                            <Translation id="RECEIVE_ADDRESS_UNAVAILABLE" />
                        )}
                    </Text>
                </InfoItem>
                <Tooltip content={buttonTooltipContent()}>
                    {isDeviceConnected ? (
                        <Button {...buttonRevealAddressProps}>
                            <Translation id="RECEIVE_ADDRESS_REVEAL" />
                        </Button>
                    ) : (
                        <Button {...buttonRevealAddressProps} intent="warning">
                            <Translation id="RECEIVE_UNVERIFIED_ADDRESS_REVEAL" />
                        </Button>
                    )}
                </Tooltip>
            </Row>
            {account.networkType === 'ethereum' && account.symbol !== 'eth' && (
                <Banner
                    icon
                    intent="info"
                    margin={{ top: spacings.xxl }}
                    title={
                        <Translation
                            id="TR_EVM_EXPLANATION_TITLE"
                            values={{
                                network: getNetwork(account.symbol).name,
                            }}
                        />
                    }
                    description={
                        <Translation
                            id="TR_EVM_EXPLANATION_RECEIVE_DESCRIPTION"
                            values={{
                                network: getNetwork(account.symbol).name,
                            }}
                        />
                    }
                />
            )}
        </Card>
    );
};
