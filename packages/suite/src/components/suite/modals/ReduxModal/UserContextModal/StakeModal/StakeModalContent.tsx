import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { StakeEthFormContext, useStakeEthForm } from 'src/hooks/wallet/useStakeEthForm';
import { StakeEthForm } from './StakeEthForm/StakeEthForm';

const Flex = styled.div`
    display: flex;
    gap: ${spacingsPx.md};
`;

const Left = styled.div`
    width: 100%;
`;

interface StakeModalContentProps {
    selectedAccount: SelectedAccountLoaded;
}

export const StakeModalContent = ({ selectedAccount }: StakeModalContentProps) => {
    const stakeEthContextValues = useStakeEthForm({ selectedAccount });

    return (
        <StakeEthFormContext.Provider value={stakeEthContextValues}>
            <Flex>
                <Left>
                    <StakeEthForm />
                </Left>

                {/*  TODO: Implement the right section with the rewards graph and staking info  */}
            </Flex>
        </StakeEthFormContext.Provider>
    );
};
