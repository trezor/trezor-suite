import styled from 'styled-components';

import { SignValue } from '@suite-common/suite-types';
import { getNftTokenId } from '@suite-common/wallet-utils';
import { TokenTransfer } from '@trezor/connect';

import { HiddenPlaceholder, Sign } from 'src/components/suite';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useSelector } from 'src/hooks/suite/useSelector';

const Container = styled.div`
    max-width: 100%;
    display: flex;
`;

const Symbol = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
`;

const StyledTrezorLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.TYPE_GREEN};
    text-decoration: underline;
    display: flex;
`;

const NoLink = styled.div`
    display: flex;
`;

const Id = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 145px;
`;

export interface FormattedNftAmountProps {
    transfer: TokenTransfer;
    signValue?: SignValue;
    className?: string;
    isWithLink?: boolean;
}

export const FormattedNftAmount = ({
    transfer,
    signValue,
    className,
    isWithLink,
}: FormattedNftAmountProps) => {
    const id = getNftTokenId(transfer);

    const { selectedAccount } = useSelector(state => state.wallet);
    const { network } = selectedAccount;
    const explorerUrl =
        network?.networkType === 'ethereum'
            ? `${network?.explorer.nft}/${transfer.contract}/${id}`
            : undefined;

    const idComponent = <Id>{id}</Id>;
    const symbolComponent = transfer.symbol ? <Symbol>&nbsp;{transfer.symbol}</Symbol> : null;

    return (
        <HiddenPlaceholder>
            <Container className={className}>
                {signValue ? <Sign value={signValue} /> : null}
                ID:&nbsp;
                {isWithLink ? (
                    <StyledTrezorLink href={explorerUrl}>
                        {idComponent}
                        {symbolComponent}
                    </StyledTrezorLink>
                ) : (
                    <NoLink>
                        {idComponent}
                        {symbolComponent}
                    </NoLink>
                )}
            </Container>
        </HiddenPlaceholder>
    );
};
