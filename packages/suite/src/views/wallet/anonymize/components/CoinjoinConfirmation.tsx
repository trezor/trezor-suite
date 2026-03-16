import { useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, H3, Note, Paragraph, Tooltip, variables } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { startCoinjoinSession } from 'src/actions/wallet/coinjoinAccountActions';
import { Error } from 'src/components/suite/Error';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectCoinjoinClient,
    selectStartCoinjoinSessionArguments,
} from 'src/reducers/wallet/coinjoinReducer';

import { Tile, type TileProps } from './Tile';

const TopFeeRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: ${spacingsPx.xs};
`;

const FeeWrapper = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    margin: ${spacingsPx.xl} 0;
    padding: ${spacingsPx.md} 0;
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

const tiles: TileProps[] = [
    {
        title: <Translation id="TR_COINJOIN_TILE_1_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_1_DESCRIPTION" />,
        iconName: 'clock',
    },
    {
        title: <Translation id="TR_COINJOIN_TILE_2_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_2_DESCRIPTION" />,
        iconName: 'circuitry',
    },
    {
        title: <Translation id="TR_COINJOIN_TILE_3_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_3_DESCRIPTION" />,
        iconName: 'lockKey',
    },
];

interface CoinjoinConfirmationProps {
    account: Account;
}

export const CoinjoinConfirmation = ({ account }: CoinjoinConfirmationProps) => {
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

    const isDisabled = isCoinjoinSessionBlocked;
    const coordinatorFeePercentage = `${coinjoinClient.coordinationFeeRate.rate * 100}%`;

    const getButtonTooltipMessage = () => {
        if (coinjoinSessionBlockedMessage) {
            return coinjoinSessionBlockedMessage;
        }
    };
    const anonymize = async () => {
        setIsLoading(true);
        await dispatch(startCoinjoinSession(...startCoinjoinArgs));
        setIsLoading(false);
    };

    return (
        <>
            <Card>
                <H3 margin={{ bottom: 32 }}>
                    <Translation id="TR_COINJOIN_SETUP" />
                </H3>
                <Tiles>
                    {tiles.map(tile => (
                        <Tile key={tile.iconName} {...tile} />
                    ))}
                </Tiles>
                <FeeWrapper>
                    <TopFeeRow>
                        <Paragraph
                            typographyStyle="body-md-strong"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Translation id="TR_SERVICE_FEE" />
                        </Paragraph>
                        <Paragraph typographyStyle="body-md-strong">
                            {coordinatorFeePercentage}
                        </Paragraph>
                    </TopFeeRow>
                    <Note>
                        <Translation id="TR_SERVICE_FEE_NOTE" />
                    </Note>
                </FeeWrapper>
            </Card>

            <Tooltip content={getButtonTooltipMessage()}>
                <Button
                    onClick={anonymize}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    margin={{ top: spacings.xl }}
                >
                    <Translation id="TR_START_COINJOIN" />
                </Button>
            </Tooltip>
        </>
    );
};
