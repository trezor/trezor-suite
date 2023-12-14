import { useState } from 'react';
import { useDispatch, useSelector } from 'src/hooks/suite';
import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { Translation, TrezorLink } from 'src/components/suite';
import { Error } from 'src/components/suite/Error';
import {
    Button,
    Card,
    Checkbox,
    H3,
    Link,
    Note,
    Paragraph,
    Tooltip,
    variables,
} from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { DATA_TOS_URL, ZKSNACKS_TERMS_URL } from '@trezor/urls';
import { startCoinjoinSession } from 'src/actions/wallet/coinjoinAccountActions';
import {
    selectCoinjoinClient,
    selectStartCoinjoinSessionArguments,
} from 'src/reducers/wallet/coinjoinReducer';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { Tile, TileProps } from './Tile';

const StyledCard = styled(Card)`
    padding: 24px;
`;

const TopRow = styled(H3)`
    display: flex;
    justify-content: space-between;
    margin-bottom: ${spacingsPx.xxl};
`;

const TopFeeRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: ${spacingsPx.xs};
`;

const FeeWrapper = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation0};
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation0};
    margin: ${spacingsPx.xl} 0;
    padding: ${spacingsPx.md} 0;
`;

const FeeHeading = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

const Tiles = styled.div`
    display: grid;
    gap: ${spacingsPx.md};
    grid-template-columns: repeat(3, 1fr);

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-template-columns: none;
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        grid-template-columns: repeat(3, 1fr);
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-template-columns: none;
    }
`;

const StyledCheckbox = styled(Checkbox)`
    ${typography.highlight}
`;

const StyledButton = styled(Button)`
    margin: ${spacingsPx.xl} auto 0;

    :disabled {
        background: ${({ theme }) => theme.STROKE_GREY};
    }
`;

const tiles: TileProps[] = [
    {
        title: <Translation id="TR_COINJOIN_TILE_1_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_1_DESCRIPTION" />,
        image: 'CLOCK',
    },
    {
        title: <Translation id="TR_COINJOIN_TILE_2_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_2_DESCRIPTION" />,
        image: 'FIRMWARE',
    },
    {
        title: <Translation id="TR_COINJOIN_TILE_3_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_3_DESCRIPTION" />,
        image: 'PIN_LOCKED',
    },
];

interface CoinjoinConfirmationProps {
    account: Account;
}

export const CoinjoinConfirmation = ({ account }: CoinjoinConfirmationProps) => {
    const [termsConfirmed, setTermsConfirmed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const coinjoinClient = useSelector(state => selectCoinjoinClient(state, account.key));
    const startCoinjoinArgs = useSelector(state =>
        selectStartCoinjoinSessionArguments(state, account.key),
    );

    const dispatch = useDispatch();

    const { coinjoinSessionBlockedMessage, isCoinjoinSessionBlocked } = useCoinjoinSessionBlockers(
        account.key,
    );

    if (!coinjoinClient || !startCoinjoinArgs) {
        return (
            <Error
                error={`Suite could not ${
                    coinjoinClient ? 'determine setup values' : 'connect to coordinator'
                }.`}
            />
        );
    }

    const isDisabled = !termsConfirmed || isCoinjoinSessionBlocked;
    const coordinatorFeePercentage = `${coinjoinClient.coordinationFeeRate.rate * 100}%`;

    const getButtonTooltipMessage = () => {
        if (coinjoinSessionBlockedMessage) {
            return coinjoinSessionBlockedMessage;
        }
        if (!termsConfirmed) {
            return <Translation id="TR_CONFIRM_CONDITIONS" />;
        }
    };
    const toggleTermsConfirmation = () => setTermsConfirmed(current => !current);
    const anonymize = async () => {
        setIsLoading(true);
        await dispatch(startCoinjoinSession(...startCoinjoinArgs));
        setIsLoading(false);
    };

    return (
        <>
            <StyledCard>
                <TopRow>
                    <Translation id="TR_COINJOIN_SETUP" />
                </TopRow>
                <Tiles>
                    {tiles.map(tile => (
                        <Tile key={tile.image} {...tile} />
                    ))}
                </Tiles>
                <FeeWrapper>
                    <TopFeeRow>
                        <FeeHeading type="highlight">
                            <Translation id="TR_SERVICE_FEE" />
                        </FeeHeading>
                        <Paragraph type="highlight">{coordinatorFeePercentage}</Paragraph>
                    </TopFeeRow>
                    <Note>
                        <Translation id="TR_SERVICE_FEE_NOTE" />
                    </Note>
                </FeeWrapper>
                <StyledCheckbox
                    isChecked={termsConfirmed}
                    onClick={toggleTermsConfirmation}
                    data-test="@coinjoin/checkbox"
                >
                    <Translation
                        id="TR_TERMS_AND_PRIVACY_CONFIRMATION"
                        values={{
                            coordinator: chunks => (
                                <Link href={ZKSNACKS_TERMS_URL} variant="underline">
                                    {chunks}
                                </Link>
                            ),
                            trezor: chunks => (
                                <TrezorLink href={DATA_TOS_URL} variant="underline">
                                    {chunks}
                                </TrezorLink>
                            ),
                        }}
                    />
                </StyledCheckbox>
            </StyledCard>

            <Tooltip content={getButtonTooltipMessage()}>
                <StyledButton onClick={anonymize} isDisabled={isDisabled} isLoading={isLoading}>
                    <Translation id="TR_START_COINJOIN" />
                </StyledButton>
            </Tooltip>
        </>
    );
};
