import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { Button, Input, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { parseBIP44Path } from '@wallet-utils/accountUtils';
import { ChildProps as Props } from '../../Container';
import { AccountAddress } from 'trezor-connect';

const StyledCard = styled(Card)`
    width: 100%;
    margin-bottom: 40px;
    padding: 32px 40px 36px 20px;
    justify-content: space-between;
    flex-wrap: wrap;
`;

const AddressContainer = styled.div`
    flex: 1;
`;

const AddressLabel = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 0 0 12px 0;
`;

const AddressPath = styled.div`
    padding: 0px 16px 10px 0px;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StyledInput = styled(Input)`
    height: 36px;
    min-width: 200px;
`;

const ButtonContainer = styled.div`
    padding-top: 32px;
`;

const StyledButton = styled(Button)`
    min-width: 180px;
    width: 100%;
    margin-left: 12px;
`;

const FreshAddress = ({
    account,
    addresses,
    showAddress,
    disabled,
    locked,
    intl,
}: Props & WrappedComponentProps) => {
    const { symbol } = account;
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
    const addressLabel = isBitcoin ? 'RECEIVE_ADDRESS_FRESH' : 'RECEIVE_ADDRESS';
    // NOTE: unrevealed[0] can be undefined (limit exceeded)
    const firstFreshAddress = isBitcoin ? unrevealed[0] : unused[0];

    const getAddressValue = (address?: AccountAddress) => {
        if (!address) {
            return intl.formatMessage(messages.RECEIVE_ADDRESS_LIMIT_EXCEEDED);
        }

        const truncatedAddress = `${address.address.substring(0, 15)}…`;
        // eth, ripple: already revealed address will show in its full form
        const isRevealed = addresses ? addresses.find(f => f.address === address.address) : false;
        return isRevealed ? address.address : truncatedAddress;
    };

    const addressValue = getAddressValue(firstFreshAddress);
    const addressPath =
        isBitcoin && firstFreshAddress
            ? `/${parseBIP44Path(firstFreshAddress.path)!.addrIndex}`
            : undefined;

    return (
        <StyledCard title={<Translation id="RECEIVE_TITLE" values={{ symbol }} />}>
            {addressPath && <AddressPath>{addressPath}</AddressPath>}
            <AddressContainer>
                <AddressLabel>
                    <Translation id={addressLabel} />
                </AddressLabel>
                <StyledInput variant="small" monospace isDisabled value={addressValue} />
            </AddressContainer>
            <ButtonContainer>
                <StyledButton
                    data-test="@wallet/receive/reveal-address-button"
                    onClick={() => showAddress(firstFreshAddress.path, firstFreshAddress.address)}
                    isDisabled={disabled || locked || !firstFreshAddress}
                    isLoading={!disabled && locked}
                >
                    <Translation id="RECEIVE_ADDRESS_REVEAL" />
                </StyledButton>
            </ButtonContainer>
        </StyledCard>
    );
};

export default injectIntl(FreshAddress);
