import React, { useState } from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';
import { FormattedMessage } from 'react-intl';

import QrCode from '@wallet-components/QrCode';
import VerifyAddressInput from '@wallet-components/inputs/VerifyAddress';
import UsedAddressesList from '@suite/components/wallet/UsedAddressesList';
import { H6, variables, Button } from '@trezor/components';
import { Address } from 'trezor-connect';
import messages from './messages';
import { ReceiveProps } from '../index';

const Wrapper = styled.div``;

const SubHeading = styled(H6)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AddFreshAddress = styled(Button)``;

const ButtonsWrapper = styled.div`
    display: flex;
    margin-top: 16px;
    /* justify-content: flex-end; */
`;

const BitcoinReceive = ({ className, ...props }: ReceiveProps) => {
    const { addresses } = props.account;
    const [selectedAddr, setSelectedAddr] = useState(null);
    if (!addresses) return null;
    return (
        <Wrapper key={props.account.descriptor}>
            <Title>
                <FormattedMessage {...messages.TR_RECEIVE_BITCOIN} />
            </Title>
            <UsedAddressesList
                addresses={addresses.used}
                device={props.device}
                isAddressHidden={props.isAddressHidden}
                isAddressVerified={props.isAddressVerified}
                isAddressUnverified={props.isAddressUnverified}
                isAddressVerifying={props.isAddressVerifying}
                showAddress={props.showAddress}
                setSelectedAddr={setSelectedAddr}
                selectedAddress={selectedAddr}
            />
            <SubHeading>Fresh address</SubHeading>
            <VerifyAddressInput
                device={props.device}
                accountPath={addresses.unused[0].path}
                accountAddress={addresses.unused[0].address}
                isAddressHidden={props.isAddressHidden}
                isAddressVerified={props.isAddressVerified}
                isAddressUnverified={props.isAddressUnverified}
                isAddressVerifying={props.isAddressVerifying}
                showAddress={props.showAddress}
            />
            <ButtonsWrapper>
                <AddFreshAddress isWhite onClick={() => {}} icon="PLUS">
                    Add fresh address
                </AddFreshAddress>
            </ButtonsWrapper>
            {(props.isAddressVerified || props.isAddressUnverified) &&
                !props.isAddressVerifying && (
                    <QrCode
                        value={addresses ? addresses.unused[0].address : props.account.descriptor}
                        accountPath={addresses ? addresses.unused[0].path : props.account.path}
                    />
                )}
        </Wrapper>
    );
};

export default BitcoinReceive;
