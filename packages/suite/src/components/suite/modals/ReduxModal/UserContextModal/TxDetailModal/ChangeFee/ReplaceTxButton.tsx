import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';
import { useRbfContext } from 'src/hooks/wallet/useRbfForm';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 22px;
`;

const StyledButton = styled(Button)`
    min-width: 30%;
`;

export const ReplaceTxButton = ({ finalize }: { finalize: boolean }) => {
    const { device, isLocked } = useDevice();
    const { isLoading, signTransaction, getValues, composedLevels } = useRbfContext();

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled =
        !composedTx || composedTx.type !== 'final' || isLocked() || (device && !device.available);

    return (
        <Wrapper>
            <StyledButton
                data-test-id="@send/replace-tx-button"
                isDisabled={isDisabled || isLoading}
                onClick={signTransaction}
            >
                <Translation id={finalize ? 'TR_FINALIZE_TX' : 'TR_REPLACE_TX'} />
            </StyledButton>
        </Wrapper>
    );
};
