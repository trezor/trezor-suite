import { Card, H3 } from '@trezor/components';
import { Translation } from '../../components/suite';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { breakpointMediaQueries, mediaQueries } from '@trezor/styles';

const GreenText = styled.span`
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const Flex = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

const StyledCard = styled(Card)`
    ${breakpointMediaQueries.below_sm}
`

// TODO: mobile view
export const RememberWalletCard = () => (
    <Card maxWidth={'478px'}>
        <Flex>
            <H3>
                <Translation
                    id="TR_REMEMBER_CARD_CALL_TO_ACTION"
                    values={{
                        primary: chunks => (
                            <>
                                <br />
                                <GreenText>{chunks}</GreenText>
                            </>
                        ),
                    }}
                />
            </H3>

            <Translation id="TR_REMEMBER_CARD_EXPLANATION" />
        </Flex>
    </Card>
);
