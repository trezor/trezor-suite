import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { networks } from '@suite-common/wallet-config';
import { transparentize } from 'polished';

const Wrapper = styled.div`
    padding: 10px 16px;
    margin-top: 10px;
    width: 100%;
    border-radius: 8px;
    background: ${() => transparentize(0.85, '#d3bc00')};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    line-height: 18px;
    text-align: left;
`;

interface TransactionReviewEvmExplanationProps {
    account: Account;
}

export const TransactionReviewEvmExplanation = ({
    account,
}: TransactionReviewEvmExplanationProps) => {
    const network = networks[account.symbol];

    if (network.networkType !== 'ethereum') {
        return null;
    }

    return (
        <Wrapper>
            <Translation
                id="TR_EVM_EXPLANATION_SEND_MODAL_DESCRIPTION"
                values={{
                    network: network.name,
                    b: text => <b>{text}</b>,
                }}
            />
        </Wrapper>
    );
};
