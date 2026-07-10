import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Address, selectAddressLabel, selectLabeledUnusedAddresses } from '@suite/address';
import type { SelectAddressLabelState, SelectLabeledUnusedAddressesState } from '@suite/address';
import { ReadMoreLink } from '@suite/external-links';
import { Translation, useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { getFirstFreshAddress } from '@suite-common/address';
import {
    type ReceiveRootState,
    receiveActions,
    selectCurrentFreshAddress,
    selectTouchedAddresses,
} from '@suite-common/receive';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
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
    disabled: boolean;
    locked: boolean;
    pendingAddresses: string[];
    isDeviceConnected: boolean;
}

export const FreshAddress = ({
    account,
    disabled,
    pendingAddresses,
    locked,
    isDeviceConnected,
}: FreshAddressProps) => {
    const dispatch = useDispatch();

    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, account.key),
    );
    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );
    const currentFreshAddress = useSelector((state: ReceiveRootState) =>
        selectCurrentFreshAddress(state, account.key),
    );

    const { isReceiveDisabled, receiveDisabledTooltipContent } = useReceiveDisabled();
    const { translationString } = useTranslation();

    const labeledAddresses = useSelector((state: SelectLabeledUnusedAddressesState) =>
        selectLabeledUnusedAddresses(state, account),
    );

    useEffect(() => {
        const alreadyUsedAddressesExceptCurrentFresh = labeledAddresses
            .concat(touchedAddresses)
            .filter(address => address.path !== currentFreshAddress?.path);

        const firstFreshAddress = getFirstFreshAddress(
            account,
            alreadyUsedAddressesExceptCurrentFresh,
            pendingAddresses,
            isAccountUtxoBased,
        );

        const hasCurrentChanged =
            currentFreshAddress?.path !== firstFreshAddress?.path ||
            currentFreshAddress?.address !== firstFreshAddress?.address;

        if (!hasCurrentChanged) {
            return;
        }

        dispatch(
            receiveActions.setCurrentFreshAddress({
                accountKey: account.key,
                currentFreshAddress: firstFreshAddress,
            }),
        );
    }, [
        account,
        touchedAddresses,
        currentFreshAddress,
        dispatch,
        isAccountUtxoBased,
        labeledAddresses,
        pendingAddresses,
    ]);

    const currentFreshAddressLabel = useSelector((state: SelectAddressLabelState) =>
        currentFreshAddress?.address
            ? selectAddressLabel(state, {
                  address: currentFreshAddress?.address,
                  deviceStaticId: account.deviceState,
              })
            : undefined,
    );

    // On coinjoin account, disallow to reveal more than the first receive address until it is used,
    // because discovery of coinjoin account relies on assumption that user uses his first address first.
    const coinjoinDisallowReveal =
        account.accountType === 'coinjoin' &&
        !account.addresses?.used.length &&
        currentFreshAddress?.address !== account.addresses?.unused[0]?.address;

    const handleAddressReveal = () => {
        if (currentFreshAddress) {
            dispatch(
                showAddressThunk({
                    path: currentFreshAddress.path,
                    address: currentFreshAddress.address,
                }),
            );
        }
    };

    const revealButtonTooltipContent = () => {
        if (coinjoinDisallowReveal) {
            return <Translation id="RECEIVE_ADDRESS_COINJOIN_DISALLOW" />;
        }
        if (!currentFreshAddress) {
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
            disabled ||
            locked ||
            coinjoinDisallowReveal ||
            !currentFreshAddress ||
            isReceiveDisabled,
        isLoading: locked,
        minWidth: 220,
        size: 'large',
    };

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
                        {currentFreshAddress?.address ? (
                            <Labeling
                                payload={{
                                    type: 'addressLabel',
                                    entityKey: account.key,
                                    defaultValue: currentFreshAddress?.address,
                                    networkSymbol: account.symbol,
                                    accountDescriptor: account.descriptor,
                                }}
                                deviceStaticSessionId={account.deviceState}
                                displayValue={
                                    <Address value={currentFreshAddress.address} isTruncated />
                                }
                                placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
                                minHeight={28}
                            >
                                {currentFreshAddressLabel}
                            </Labeling>
                        ) : (
                            <Translation id="RECEIVE_ADDRESS_UNAVAILABLE" />
                        )}
                    </Text>
                </InfoItem>
                <Tooltip content={revealButtonTooltipContent()}>
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
