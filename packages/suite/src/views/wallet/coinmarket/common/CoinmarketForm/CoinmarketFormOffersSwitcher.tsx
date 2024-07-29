/*
import styled, { css } from 'styled-components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { variables } from '@trezor/components/src/config';
import { Badge, Radio, Spinner, Tooltip } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CoinmarketUtilsProvider } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsProvider';
import { BuyTrade, SellFiatTrade } from 'invity-api';
import { CoinmarketUtilsProvidersProps } from 'src/types/coinmarket/coinmarket';

const BestOffers = styled.div`
    padding: ${spacingsPx.xxs};
    gap: ${spacingsPx.xxs};
    border-radius: ${borders.radii.md};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
`;

const Offer = styled.div<{ $isSelected: boolean }>`
    padding: ${spacingsPx.md};
    border-radius: ${borders.radii.sm};

    // full width radio label
    & > div > div:last-child {
        width: 100%;
    }

    .content {
        display: flex;
        align-items: center;
        width: 100%;
        gap: ${spacingsPx.xs};
    }

    .type {
        color: ${({ theme }) => theme.textPrimaryDefault};
        margin-left: auto;
    }

    ${({ $isSelected }) =>
        $isSelected
            ? css`
                  background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
              `
            : css`
                  .name {
                      color: ${({ theme }) => theme.textDisabled};
                  }
                  .type {
                      color: ${({ theme }) => theme.textSubdued};
                  }
              `}
`;

const NotFound = styled.div`
    text-align: center;
    padding: ${spacingsPx.md};
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.textSubdued};
`;

const NoOffers = styled.div`
    height: 116px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${spacingsPx.md};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const CoinmarketFormOfferSpinnerText = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    text-align: center;
`;

const CoinmarketSpinnerWrapper = styled(Spinner)`
    flex: none;
    margin: 0 ${spacingsPx.xs};
`;

type ExchangeType = 'CEX' | 'DEX';

interface OfferItemProps {
    selected: boolean;
    singleOption: boolean;
    onClick: (_type: ExchangeType) => void;
    bestQuote: BuyTrade | SellFiatTrade | undefined;
    providers: CoinmarketUtilsProvidersProps | undefined;
    exchange: string;
    isBestRate?: boolean;
    type: ExchangeType;
}

const OfferItem = ({
    selected,
    onClick,
    bestQuote,
    providers,
    isBestRate,
    type,
    singleOption,
}: OfferItemProps) => {
    const content = (
        <div className="content">
            <CoinmarketUtilsProvider providers={providers} exchange={bestQuote?.exchange} />
            {isBestRate && (
                <Badge variant="primary" size="small">
                    <Translation id="TR_COINMARKET_BEST_RATE" />
                </Badge>
            )}
            <div className="type">
                <Tooltip content={<Translation id={`TR_COINMARKET_${type}_TOOLTIP`} />}>
                    {type}
                </Tooltip>
            </div>
        </div>
    );

    return (
        <Offer $isSelected={selected}>
            {singleOption ? (
                <div>{content}</div>
            ) : (
                <Radio labelAlignment="left" isChecked={selected} onClick={() => onClick(type)}>
                    {content}
                </Radio>
            )}
        </Offer>
    );
};

interface ExchangeBestOffersProps {
    isFormLoading: boolean;
    isFormInvalid: boolean;
    providers: CoinmarketUtilsProvidersProps | undefined;
}

const CoinmarketFormOffersSwitcher = ({
    isFormLoading,
    isFormInvalid,
    providers,
}: ExchangeBestOffersProps) => {
    // TODO: hardcoded values and structure
    const bestOffers = [
        {
            exchange: 'sideshiftfr',
            isBestRate: true,
            isCex: true,
        },
        // {
        //     exchange: 'topper-sandbox',
        //     isDex: true,
        // },
    ];
    const selectedType = 'cex';
    const cexSelected = selectedType === 'cex';
    const dexSelected = selectedType === 'dex';
    const cexOffer = bestOffers.find(offer => offer.isCex);
    const dexOffer = bestOffers.find(offer => offer.isDex);
    const singleOption = bestOffers.length === 1;

    if (isFormLoading && !isFormInvalid) {
        return (
            <BestOffers>
                <NoOffers>
                    <CoinmarketSpinnerWrapper size={32} isGrey={false} />
                    <CoinmarketFormOfferSpinnerText>
                        <Translation id="TR_COINMARKET_OFFER_LOOKING" />
                    </CoinmarketFormOfferSpinnerText>
                </NoOffers>
            </BestOffers>
        );
    }

    if (!bestOffers.length) {
        return (
            <BestOffers>
                <NoOffers>
                    <Translation id="TR_COINMARKET_OFFER_NO_FOUND" />
                </NoOffers>
            </BestOffers>
        );
    }

    return (
        <BestOffers>
            {cexOffer ? (
                <OfferItem
                    selected={cexSelected}
                    singleOption={singleOption}
                    onClick={() => {}}
                    providers={providers}
                    bestQuote={cexOffer}
                    isBestRate={cexOffer.isBestRate}
                    type="CEX"
                />
            ) : (
                <NotFound>
                    <Translation id="TR_COINMARKET_NO_CEX_PROVIDER_FOUND" />
                </NotFound>
            )}
            {dexOffer ? (
                <OfferItem
                    selected={dexSelected}
                    singleOption={singleOption}
                    onClick={() => {}}
                    providers={providers}
                    bestQuote={dexOffer}
                    isBestRate={dexOffer.isBestRate}
                    type="DEX"
                />
            ) : (
                <NotFound>
                    <Translation id="TR_COINMARKET_NO_DEX_PROVIDER_FOUND" />
                </NotFound>
            )}
        </BestOffers>
    );
};

export default CoinmarketFormOffersSwitcher;
*/
