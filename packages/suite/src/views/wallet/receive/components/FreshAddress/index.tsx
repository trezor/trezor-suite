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
    align-items: flex-end;
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
    font-variant-numeric: tabular-nums slashed-zero;
`;

const StyledButton = styled(Button)`
    min-width: 220px;
    margin-left: 20px;
`;

const FreshAddress = ({
    account,
    addresses,
    showAddress,
    // changeMetadata,
    disabled,
    locked,
    intl,
}: Omit<Props, 'changeMetadata'> & WrappedComponentProps) => {
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
    // const { addressLabels } = account.metadata;

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
            <StyledButton
                data-test="@wallet/receive/reveal-address-button"
                onClick={() => showAddress(firstFreshAddress.path, firstFreshAddress.address)}
                isDisabled={disabled || locked || !firstFreshAddress}
                isLoading={!disabled && locked}
            >
                <Translation id="RECEIVE_ADDRESS_REVEAL" />
            </StyledButton>
            {/* <Button
                variant="tertiary"
                icon="LABEL"
                onClick={() =>
                    changeMetadata(
                        firstFreshAddress.address,
                        addressLabels[firstFreshAddress.address],
                    )
                }
            /> */}
            {/* {addressLabels[firstFreshAddress.address] && (
                <span>({addressLabels[firstFreshAddress.address]})</span>
            )} */}
        </StyledCard>
    );
};

export default injectIntl(FreshAddress);
