import { useMemo } from 'react';

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
    flex-flow: row wrap;
    margin-bottom: 16px;
    align-items: center;
    justify-content: space-between;
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
    inset: 0;
    position: absolute;
    background-image: linear-gradient(
        to right,
        rgb(0 0 0 / 0%) 0%,
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
        return null;
    };

    return (
        <StyledCard>
            <AddressContainer>
                <TooltipLabel
                    multipleAddresses={isAccountUtxoBased}
                    symbol={account.symbol}
                    accountType={account.accountType}
                />
                <FreshAddressWrapper>
                    {addressValue && <Overlay />}
                    <StyledFreshAddress>
                        {addressValue ?? <Translation id="RECEIVE_ADDRESS_UNAVAILABLE" />}
                    </StyledFreshAddress>
                </FreshAddressWrapper>
            </AddressContainer>
            <Tooltip content={buttonTooltipContent()}>
                <StyledButton
                    data-test="@wallet/receive/reveal-address-button"
                    icon="TREZOR_LOGO"
                    onClick={handleAddressReveal}
                    isDisabled={disabled || locked || coinjoinDisallowReveal || !firstFreshAddress}
                    isLoading={locked}
                >
                    <Translation id="RECEIVE_ADDRESS_REVEAL" />
                </StyledButton>
            </Tooltip>
        </StyledCard>
    );
};
