import { useMemo } from 'react';

import styled from 'styled-components';

import {
    Button,
    Card,
    Text,
    Tooltip,
    GradientOverlay,
    Row,
    InfoItem,
    H4,
    Banner,
    Paragraph,
} from '@trezor/components';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';
import { AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';
import { networks } from '@suite-common/wallet-config';
import { spacings } from '@trezor/theme';

import { Translation, ReadMoreLink } from 'src/components/suite';
import { AppState } from 'src/types/suite';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { useDispatch, useSelector } from 'src/hooks/suite/';
import { selectIsFirmwareAuthenticityCheckEnabledAndHardFailed } from 'src/reducers/suite/suiteReducer';

const FreshAddressWrapper = styled.div`
    position: relative;
`;

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
        <H4 variant="tertiary" typographyStyle="hint">
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
        selectIsAccountUtxoBased(state, account?.key ?? ''),
    );
    const isAuthenticityCheckFailed = useSelector(
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    );
    const dispatch = useDispatch();

    const firstFreshAddress = useMemo(() => {
        if (account) {
            return getFirstFreshAddress(account, addresses, pendingAddresses, isAccountUtxoBased);
        }
    }, [account, addresses, pendingAddresses, isAccountUtxoBased]);

    if (!account) return null;

    const addressValue = firstFreshAddress?.address?.substring(0, 20);

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
        if (isAuthenticityCheckFailed) {
            return <Translation id="TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED" />;
        }

        return null;
    };

    const buttonRevealAddressProps = {
        'data-testid': '@wallet/receive/reveal-address-button',
        onClick: handleAddressReveal,
        isDisabled:
            disabled ||
            locked ||
            coinjoinDisallowReveal ||
            !firstFreshAddress ||
            isAuthenticityCheckFailed,
        isLoading: locked,
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
                    <FreshAddressWrapper>
                        {addressValue && <GradientOverlay hiddenFrom="220px" />}
                        <Text typographyStyle="titleMedium">
                            {addressValue ?? <Translation id="RECEIVE_ADDRESS_UNAVAILABLE" />}
                        </Text>
                    </FreshAddressWrapper>
                </InfoItem>
                <Tooltip content={buttonTooltipContent()}>
                    {isDeviceConnected ? (
                        <Button minWidth={220} icon="trezor" {...buttonRevealAddressProps}>
                            <Translation id="RECEIVE_ADDRESS_REVEAL" />
                        </Button>
                    ) : (
                        <Button minWidth={220} {...buttonRevealAddressProps} variant="warning">
                            <Translation id="RECEIVE_UNVERIFIED_ADDRESS_REVEAL" />
                        </Button>
                    )}
                </Tooltip>
            </Row>
            {account.networkType === 'ethereum' && (
                <Banner icon variant="info" margin={{ top: spacings.xxl }}>
                    <H4>
                        <Translation
                            id="TR_EVM_EXPLANATION_TITLE"
                            values={{
                                network: networks[account.symbol].name,
                            }}
                        />
                    </H4>
                    <Paragraph>
                        <Translation
                            id="TR_EVM_EXPLANATION_RECEIVE_DESCRIPTION"
                            values={{
                                network: networks[account.symbol].name,
                            }}
                        />
                    </Paragraph>
                </Banner>
            )}
        </Card>
    );
};
