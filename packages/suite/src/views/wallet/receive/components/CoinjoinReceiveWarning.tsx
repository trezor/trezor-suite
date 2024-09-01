import styled, { useTheme } from 'styled-components';
import { darken } from 'polished';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { Button, Icon, variables, Warning } from '@trezor/components';
import { hideCoinjoinReceiveWarning } from 'src/actions/suite/suiteActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const Container = styled.div`
    margin-bottom: 16px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const InfoIcon = styled(Icon)`
    width: 18px;
    height: 18px;
    margin-right: 6px;
    align-self: flex-start;
    background: ${({ theme }) => theme.legacy.TYPE_LIGHT_ORANGE};
    border-radius: 50%;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-self: start;
    }
`;

const Text = styled.div`
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.legacy.TYPE_DARK_ORANGE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
`;

const WarningList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-left: 16px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    background: ${({ theme }) => theme.legacy.TYPE_DARK_ORANGE};

    &:hover,
    &:focus,
    &:active {
        background: ${({ theme }) =>
            darken(theme.legacy.HOVER_DARKEN_FILTER, theme.legacy.TYPE_DARK_ORANGE)};
    }
`;

export const CoinjoinReceiveWarning = () => {
    const account = useSelector(selectSelectedAccount);

    const theme = useTheme();
    const dispatch = useDispatch();

    if (!account) {
        return null;
    }

    return (
        <Container>
            <Warning
                rightContent={
                    <StyledButton onClick={() => dispatch(hideCoinjoinReceiveWarning())}>
                        <Translation id="TR_GOT_IT" />
                    </StyledButton>
                }
            >
                <Text>
                    <Heading>
                        <InfoIcon name="info" size={14} color={theme.legacy.TYPE_DARK_ORANGE} />
                        <Translation id="TR_COINJOIN_RECEIVE_WARNING_TITLE" />
                    </Heading>

                    <WarningList>
                        <li>
                            <Translation id="TR_COINJOIN_CEX_WARNING" />
                        </li>

                        <li>
                            <Translation id="TR_UNECO_COINJOIN_RECEIVE_WARNING" />
                        </li>
                    </WarningList>
                </Text>
            </Warning>
        </Container>
    );
};
