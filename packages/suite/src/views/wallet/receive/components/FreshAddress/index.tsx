import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { Button, Input } from '@trezor/components-v2';
import { parseBIP44Path } from '@wallet-utils/accountUtils';
import { ChildProps as Props } from '../../Container';

const StyledCard = styled(Card)`
    width: 100%;
    max-width: 1024px;
    min-height: 95px;
    border-radius: 6px;
    margin-top: 24px;
    margin-bottom: 40px;
    padding: 16px;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
`;

const AddressContainer = styled.div`
    flex: 1;
`;

const AddressPath = styled.div`
    padding: 0px 16px 8px 0px;
`;

const StyledButton = styled(Button)`
    min-width: 220px;
    margin-left: 20px;
`;

const FreshAddress = ({ account, addresses, showAddress, disabled, locked }: Props) => {
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
    const limitExceeded = unrevealed.length < 1;
    const addressLabel = isBitcoin ? 'Fresh address' : 'Receive address';

    if (isBitcoin && limitExceeded) {
        return (
            <StyledCard>
                <AddressContainer>
                    <Input
                        topLabel={addressLabel}
                        variant="small"
                        isDisabled
                        value="Limit exceeded..."
                    />
                </AddressContainer>
                <StyledButton isDisabled>Reveal full address</StyledButton>
            </StyledCard>
        );
    }

    const firstFreshAddress = account.addresses ? unrevealed[0] : unused[0];
    const addressValue =
        isBitcoin || (!isBitcoin && !limitExceeded)
            ? `${firstFreshAddress.address.substring(0, 15)}…`
            : firstFreshAddress.address;

    const addressPath = isBitcoin
        ? `/${parseBIP44Path(firstFreshAddress.path)!.addrIndex}`
        : undefined;

    return (
        <StyledCard>
            {addressPath && <AddressPath>{addressPath}</AddressPath>}
            <AddressContainer>
                <Input topLabel={addressLabel} variant="small" isDisabled value={addressValue} />
            </AddressContainer>
            <StyledButton
                data-test="@wallet/receive/reveal-address-button"
                onClick={() => showAddress(firstFreshAddress.path, firstFreshAddress.address)}
                isDisabled={disabled}
                isLoading={!disabled && locked}
            >
                Reveal full address
            </StyledButton>
        </StyledCard>
    );
};

export default FreshAddress;
