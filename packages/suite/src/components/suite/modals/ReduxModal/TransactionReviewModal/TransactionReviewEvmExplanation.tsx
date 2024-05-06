import { Warning } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { networks } from '@suite-common/wallet-config';
import {
    FrameProps,
    TransientFrameProps,
    withFrameProps,
} from '@trezor/components/src/components/common/frameProps';
import styled from 'styled-components';

const Wrapper = styled.div<TransientFrameProps>`
    ${withFrameProps}
`;

type TransactionReviewEvmExplanationProps = {
    account: Account;
    margin?: FrameProps['margin'];
};

export const TransactionReviewEvmExplanation = ({
    account,
    margin,
}: TransactionReviewEvmExplanationProps) => {
    const network = networks[account.symbol];

    if (network.networkType !== 'ethereum') {
        return null;
    }

    return (
        <Wrapper $margin={margin}>
            <Warning>
                <Translation
                    id="TR_EVM_EXPLANATION_SEND_MODAL_DESCRIPTION"
                    values={{
                        network: network.name,
                        b: text => <b>{text}</b>,
                    }}
                />
            </Warning>
        </Wrapper>
    );
};
