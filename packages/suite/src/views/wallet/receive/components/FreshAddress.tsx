import React, { useMemo } from 'react';

import styled from 'styled-components';
import { Translation, QuestionTooltip, ReadMoreLink } from 'src/components/suite';
import { AppState } from 'src/types/suite';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { useDispatch, useSelector } from 'src/hooks/suite/';

import { Button, Card, variables, H2, Tooltip } from '@trezor/components';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';
import { AccountsRootState, selectIsAccountUtxoBased } from '@suite-common/wallet-core';

const StyledCard = styled(Card)`
    width: 100%;
    flex-direction: row;
    margin-bottom: 16px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 32px 42px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 32px 20px;
    }

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        button {
            width: 100%;
            margin-left: auto;
            margin-top: 12px;
        }
    }
`;

const AddressContainer = styled.div`
    flex: 1;
`;

const StyledButton = styled(Button)`
    min-width: 220px;
    margin-left: 20px;
`;

const FreshAddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    margin-top: 8px;
`;

const StyledFreshAddress = styled(H2)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;
const AddressLabel = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    letter-spacing: 0.2px;
    text-transform: uppercase;
    font-variant-numeric: slashed-zero tabular-nums;
`;

const Overlay = styled.div`
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    position: absolute;
    background-image: linear-gradient(
        to right,
        rgba(0, 0, 0, 0) 0%,
        ${({ theme }) => theme.BG_WHITE} 220px
    );
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
        <AddressLabel>
            <Translation id={multipleAddresses ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS'} />
        </AddressLabel>
    );

    if (symbol === 'ltc' && accountType === 'segwit') {
        // additional tooltip with LTC addresses explanation
        return (
            <QuestionTooltip
                label={addressLabel}
                tooltip={<ReadMoreLink message="TR_LTC_ADDRESS_INFO" url="LTC_ADDRESS_INFO_URL" />}
            />
        );
    }
    if (symbol === 'bch') {
        // additional tooltip with BCH addresses explanation
        return (
            <QuestionTooltip
                label={addressLabel}
                tooltip={
                    <ReadMoreLink message="TR_BCH_ADDRESS_INFO" url="HELP_CENTER_CASHADDR_URL" />
                }
            />
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
}

export const FreshAddress = ({
    account,
    addresses,
    disabled,
    pendingAddresses,
    locked,
}: FreshAddressProps) => {
    const isAccountUtxoBased = useSelector((state: AccountsRootState) =>
        selectIsAccountUtxoBased(state, account?.key ?? ''),
    );
    const dispatch = useDispatch();

    const firstFreshAddress = useMemo(() => {
        if (account) {
            return getFirstFreshAddress(account, addresses, pendingAddresses, isAccountUtxoBased);
        }
    }, [account, addresses, pendingAddresses, isAccountUtxoBased]);

    if (!account || !firstFreshAddress) return null;

    const addressValue = `${firstFreshAddress.address.substring(0, 20)}`;

    // On coinjoin account, disallow to reveal more than the first receive address until it is used,
    // because discovery of coinjoin account relies on assumption that user uses his first address first.
    const coinjoinDisallowReveal =
        account.accountType === 'coinjoin' &&
        !account.addresses?.used.length &&
        firstFreshAddress.address !== account.addresses?.unused[0]?.address;

    const handleAddressReveal = () =>
        dispatch(showAddress(firstFreshAddress.path, firstFreshAddress.address));

    return (
        <StyledCard>
            <AddressContainer>
                <TooltipLabel
                    multipleAddresses={isAccountUtxoBased}
                    symbol={account.symbol}
                    accountType={account.accountType}
                />
                <FreshAddressWrapper>
                    <Overlay />
                    <StyledFreshAddress>{addressValue}</StyledFreshAddress>
                </FreshAddressWrapper>
            </AddressContainer>
            <Tooltip
                content={
                    coinjoinDisallowReveal && <Translation id="RECEIVE_ADDRESS_COINJOIN_DISALLOW" />
                }
            >
                <StyledButton
                    data-test="@wallet/receive/reveal-address-button"
                    icon="TREZOR_LOGO"
                    onClick={handleAddressReveal}
                    isDisabled={disabled || locked || coinjoinDisallowReveal}
                    isLoading={locked}
                >
                    <Translation id="RECEIVE_ADDRESS_REVEAL" />
                </StyledButton>
            </Tooltip>
        </StyledCard>
    );
};
