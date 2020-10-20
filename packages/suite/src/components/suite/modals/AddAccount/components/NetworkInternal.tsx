import React from 'react';
import styled from 'styled-components';
import { P, colors } from '@trezor/components';
import { Network } from '@wallet-types';
import { Translation, ExternalLink } from '@suite-components';
import { WIKI_BECH32_URL, WIKI_P2SH_URL, WIKI_P2PHK_URL } from '@suite-constants/urls';
import { getBip43Shortcut } from '@wallet-utils/accountUtils';
import { ExtendedMessageDescriptor } from '@suite-types';

interface Props {
    network: Network;
    accountTypes?: Network[];
}

const StyledP = styled(P)`
    color: ${colors.BLACK50};
    margin-bottom: 32px;
`;

const NetworkInternal = ({ network, accountTypes }: Props) => {
    if (!accountTypes || accountTypes.length <= 1) return null;
    const bip43 = getBip43Shortcut(network.bip44);
    let accountTypeDesc: ExtendedMessageDescriptor['id'] = 'TR_ACCOUNT_DETAILS_TYPE_P2PKH';
    let accountTypeUrl = WIKI_P2PHK_URL;
    if (bip43 === 'bech32') {
        accountTypeDesc = 'TR_ACCOUNT_DETAILS_TYPE_BECH32';
        accountTypeUrl = WIKI_BECH32_URL;
    }
    if (bip43 === 'p2sh') {
        accountTypeDesc = 'TR_ACCOUNT_DETAILS_TYPE_P2SH';
        accountTypeUrl = WIKI_P2SH_URL;
    }

    return (
        <StyledP size="small" textAlign="left">
            <Translation id={accountTypeDesc} />{' '}
            <ExternalLink href={accountTypeUrl} size="small">
                <Translation id="TR_LEARN_MORE" />
            </ExternalLink>
        </StyledP>
    );
};

export default NetworkInternal;
