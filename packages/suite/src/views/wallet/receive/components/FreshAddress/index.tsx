import React from 'react';
import styled from 'styled-components';
import { AccountAddress } from 'trezor-connect';
import { Button, Card, variables } from '@trezor/components';
import { Translation, QuestionTooltip, ReadMoreLink } from '@suite-components';
import { AppState } from '@suite-types';

const StyledCard = styled(Card)`
    width: 100%;
    flex-direction: row;
    margin-bottom: 40px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 32px 42px;

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

const StyledFreshAddress = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.H2};
`;
const AddressLabel = styled.span`
    font-weight: 600;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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
        ${props => props.theme.BG_WHITE} 220px
    );
`;

const TooltipLabel = ({ symbol, isBitcoin }: { symbol: string; isBitcoin: boolean }) => {
    const addressLabel = (
        <AddressLabel>
            <Translation id={isBitcoin ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS'} />
        </AddressLabel>
    );

    if (symbol === 'ltc') {
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
                tooltip={<ReadMoreLink message="TR_BCH_ADDRESS_INFO" url="BCH_ADDRESS_INFO_URL" />}
            />
        );
    }
    return addressLabel;
};

interface Props {
    account: AppState['wallet']['selectedAccount']['account'];
    addresses: AppState['wallet']['receive'];
    showAddress: (path: string, address: string) => void;
    disabled: boolean;
    locked: boolean;
    pendingAddresses: string[];
}

const FreshAddress = ({
    account,
    addresses,
    showAddress,
    disabled,
    pendingAddresses,
    locked,
}: Props) => {
    if (!account) return null; // Needed?

    const isBitcoin = account.networkType === 'bitcoin';
    const unused = account.addresses
        ? account.addresses.unused
        : [
              {
                  path: account.path,
                  address: account.descriptor,
                  transfers: account.history.total,
              },
          ];

    const unrevealed = unused.filter(
        a =>
            !addresses.find(r => r.path === a.path) && !pendingAddresses.find(p => p === a.address),
    );
    // const addressLabel = isBitcoin ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS';
    // NOTE: unrevealed[0] can be undefined (limit exceeded)
    const firstFreshAddress = isBitcoin ? unrevealed[0] : unused[0];

    const getAddressValue = (address?: AccountAddress) => {
        if (!address) {
            return <Translation id="RECEIVE_ADDRESS_LIMIT_EXCEEDED" />;
        }

        return `${address.address.substring(0, 20)}`;
    };

    const addressValue = getAddressValue(firstFreshAddress);

    return (
        <StyledCard>
            <AddressContainer>
                <TooltipLabel isBitcoin={isBitcoin} symbol={account.symbol} />
                <FreshAddressWrapper>
                    <Overlay />
                    <StyledFreshAddress>{addressValue}</StyledFreshAddress>
                </FreshAddressWrapper>
            </AddressContainer>
            <StyledButton
                data-test="@wallet/receive/reveal-address-button"
                icon="TREZOR_LOGO"
                onClick={() => showAddress(firstFreshAddress.path, firstFreshAddress.address)}
                isDisabled={disabled || locked || !firstFreshAddress}
            >
                <Translation id="RECEIVE_ADDRESS_REVEAL" />
            </StyledButton>
        </StyledCard>
    );
};

export default FreshAddress;
