import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import { Button, Input, Card } from '@trezor/components';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { ChildProps as Props } from '../../Container';
import { AccountAddress } from 'trezor-connect';

const StyledCard = styled(Card)`
    width: 100%;
    flex-direction: row;
    margin-bottom: 40px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;

    @media all and (max-width: 860px) {
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

const StyledInput = styled(Input)`
    height: 36px;
    font-variant-numeric: tabular-nums slashed-zero;
`;

const StyledButton = styled(Button)`
    min-width: 220px;
    margin-left: 20px;
    margin-top: 5px;
`;

const InputLabel = ({ symbol, isBitcoin }: { symbol: string; isBitcoin: boolean }) => {
    const addressLabel = isBitcoin ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS';
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
    return <Translation id={addressLabel} />;
};

const FreshAddress = ({
    account,
    addresses,
    showAddress,
    disabled,
    locked,
    intl,
}: Props & WrappedComponentProps) => {
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
    const unrevealed = unused.filter(a => !addresses.find(r => r.path === a.path));
    // const addressLabel = isBitcoin ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS';
    // NOTE: unrevealed[0] can be undefined (limit exceeded)
    const firstFreshAddress = isBitcoin ? unrevealed[0] : unused[0];

    const isRevealed = (addr: AccountAddress) =>
        addresses ? !!addresses.find(f => f.address === addr.address) : false;
    const getAddressValue = (address?: AccountAddress) => {
        if (!address) {
            return intl.formatMessage(messages.RECEIVE_ADDRESS_LIMIT_EXCEEDED);
        }

        const truncatedAddress = `${address.address.substring(0, 15)}…`;
        // eth, ripple: already revealed address will show in its full form
        return isRevealed(address) ? address.address : truncatedAddress;
    };

    const addressValue = getAddressValue(firstFreshAddress);

    return (
        <StyledCard>
            <AddressContainer>
                <StyledInput
                    // label={<Translation id={addressLabel} />}
                    variant="small"
                    monospace
                    isDisabled
                    value={addressValue}
                    // isPartiallyHidden={!isRevealed(firstFreshAddress)}
                />
            </AddressContainer>
            <StyledButton
                data-test="@wallet/receive/reveal-address-button"
                onClick={() => showAddress(firstFreshAddress.path, firstFreshAddress.address)}
                isDisabled={disabled || locked || !firstFreshAddress}
            >
                <Translation id="RECEIVE_ADDRESS_REVEAL" />
            </StyledButton>
        </StyledCard>
    );
};

export default injectIntl(FreshAddress);
