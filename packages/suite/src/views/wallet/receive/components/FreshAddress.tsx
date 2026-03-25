import { useMemo } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { selectLabelingDataForSelectedAccount } from '@suite/metadata';
import { selectSuiteSyncAddressLabels } from '@suite-common/suite-sync';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';
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

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Address, Labeling, ReadMoreLink } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite/';
import { useReceiveDisabled } from 'src/hooks/suite/useReceiveDisabled';
import { type AppState } from 'src/types/suite';

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

interface FreshAddressProps {
    account: AppState['wallet']['selectedAccount']['account'];
    addresses: AppState['wallet']['receive'];
    disabled: boolean;
    locked: boolean;
    pendingAddresses: string[];
    isDeviceConnected: boolean;
}

export const FreshAddress = ({
    account,
    addresses,
    disabled,
    pendingAddresses,
    locked,
    isDeviceConnected,
}: FreshAddressProps) => {
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, account?.key ?? null),
    );
    const { addressLabels } = useSelector(selectLabelingDataForSelectedAccount);
    const suiteSyncAddressLabels = useSelector(state =>
        account ? selectSuiteSyncAddressLabels(state, account.deviceState) : [],
    );
    const { isReceiveDisabled, receiveDisabledTooltipContent } = useReceiveDisabled();
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const firstFreshAddress = useMemo(() => {
        if (account) {
            return getFirstFreshAddress(account, addresses, pendingAddresses, isAccountUtxoBased);
        }
    }, [account, addresses, pendingAddresses, isAccountUtxoBased]);

    if (!account) return null;

    // On coinjoin account, disallow to reveal more than the first receive address until it is used,
    // because discovery of coinjoin account relies on assumption that user uses his first address first.
    const coinjoinDisallowReveal =
        account.accountType === 'coinjoin' &&
        !account.addresses?.used.length &&
        firstFreshAddress?.address !== account.addresses?.unused[0]?.address;

    const handleAddressReveal = () => {
        if (firstFreshAddress)
            dispatch(showAddress(firstFreshAddress.path, firstFreshAddress.address));
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
          addressLabels[firstFreshAddress.address])
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
                                maxWidth={300}
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
