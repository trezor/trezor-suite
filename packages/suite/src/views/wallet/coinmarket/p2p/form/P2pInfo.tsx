import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Note, Tooltip, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    margin-bottom: 20px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;

export const P2pInfo = () => (
    <Wrapper>
        <Note>
            <Translation
                id="TR_P2P_INFO"
                values={{
                    peerToPeer: (
                        <StyledTooltip
                            content={<Translation id="TR_P2P_INFO_PEER_TO_PEER_TOOLTIP" />}
                            dashed
                        >
                            <Translation id="TR_P2P_INFO_PEER_TO_PEER" />
                        </StyledTooltip>
                    ),
                    multisigEscrow: (
                        <StyledTooltip
                            content={<Translation id="TR_P2P_INFO_MULTISIG_ESCROW_TOOLTIP" />}
                            dashed
                        >
                            <Translation id="TR_P2P_INFO_MULTISIG_ESCROW" />
                        </StyledTooltip>
                    ),
                }}
            />
        </Note>
    </Wrapper>
);
