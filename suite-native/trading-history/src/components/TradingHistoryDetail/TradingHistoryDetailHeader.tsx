import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingTransactionStatus,
    type TradingType,
    isFinalStatus,
    selectTradingProviderCompanyName,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import {
    AnimatedBox,
    AnimatedHStack,
    AnimatedText,
    Box,
    Pictogram,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

import {
    tradingHistoryDetailEnteringTransition,
    tradingHistoryDetailExitingTransition,
    tradingHistoryDetailLayoutTransition,
} from '../../utils/tradingHistoryDetailAnimations';
import { FailCrossSvg } from '../FailCrossSvg';
import { SuccessSvg } from '../SuccessSvg';

type TradingHistoryDetailHeaderProps = {
    orderId: string;
};

type HeaderState =
    | 'buy-completed'
    | 'buy-failed'
    | 'buy-processing'
    | 'exchange-completed'
    | 'exchange-kyc'
    | 'exchange-processing'
    | 'exchange-returned'
    | 'sell-completed'
    | 'sell-failed'
    | 'sell-processing';

const HEADER_ARTWORK_SIZE = 120;
const COMPACT_HEADER_ARTWORK_SIZE = 32;

const getHeaderState = (tradeType: TradingType, status: TradingTransactionStatus): HeaderState => {
    switch (tradeType) {
        case 'buy':
        case 'sell': {
            if (status === 'SUCCESS') {
                return `${tradeType}-completed`;
            }

            if (isFinalStatus(tradeType, status)) {
                return `${tradeType}-failed`;
            }

            return `${tradeType}-processing`;
        }
        case 'exchange':
            if (status === 'SUCCESS') {
                return 'exchange-completed';
            }

            if (status === 'KYC') {
                return 'exchange-kyc';
            }

            if (status === 'ERROR') {
                return 'exchange-returned';
            }

            return 'exchange-processing';
        default:
            return exhaustive(tradeType);
    }
};

const useTradingHistoryDetailHeaderState = (orderId: string) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );

    if (!trade) {
        return {
            exchange: undefined,
            headerState: null,
            tradeType: undefined,
        };
    }

    const {
        data: { exchange, status },
        tradeType,
    } = trade;

    return {
        exchange,
        headerState: getHeaderState(tradeType, status),
        tradeType,
    };
};

const TradingHistoryDetailHeaderTitle = ({ headerState }: { headerState: HeaderState }) => {
    switch (headerState) {
        case 'buy-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.processing.title" />
            );
        case 'buy-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.completed.title" />
            );
        case 'buy-failed':
            return <Translation id="moduleTrading.tradeHistory.detail.header.buy.failed.title" />;
        case 'sell-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.processing.title" />
            );
        case 'sell-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.completed.title" />
            );
        case 'sell-failed':
            return <Translation id="moduleTrading.tradeHistory.detail.header.sell.failed.title" />;
        case 'exchange-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.processing.title" />
            );
        case 'exchange-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.completed.title" />
            );
        case 'exchange-kyc':
            return <Translation id="moduleTrading.tradeHistory.detail.header.exchange.kyc.title" />;
        case 'exchange-returned':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.returned.title" />
            );
        default:
            return exhaustive(headerState);
    }
};

type TradingHistoryDetailHeaderSubtitleProps = {
    headerState: HeaderState;
    providerName: string;
};

const TradingHistoryDetailHeaderSubtitle = ({
    headerState,
    providerName,
}: TradingHistoryDetailHeaderSubtitleProps) => {
    switch (headerState) {
        case 'buy-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.processing.description" />
            );
        case 'buy-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.completed.description" />
            );
        case 'buy-failed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.buy.failed.description" />
            );
        case 'sell-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.processing.description" />
            );
        case 'sell-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.completed.description" />
            );
        case 'sell-failed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.sell.failed.description" />
            );
        case 'exchange-processing':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.processing.description" />
            );
        case 'exchange-completed':
            return (
                <Translation id="moduleTrading.tradeHistory.detail.header.exchange.completed.description" />
            );
        case 'exchange-kyc':
            return (
                <Translation
                    id="moduleTrading.tradeHistory.detail.header.exchange.kyc.description"
                    values={{ providerName }}
                />
            );
        case 'exchange-returned':
            return (
                <Translation
                    id="moduleTrading.tradeHistory.detail.header.exchange.returned.description"
                    values={{ providerName }}
                />
            );
        default:
            return exhaustive(headerState);
    }
};

type TradingHistoryDetailHeaderArtworkProps = {
    headerState: HeaderState;
    size: number;
};

const TradingHistoryDetailHeaderArtwork = ({
    headerState,
    size,
}: TradingHistoryDetailHeaderArtworkProps) => {
    switch (headerState) {
        case 'buy-completed':
        case 'exchange-completed':
        case 'sell-completed':
            return (
                <AnimatedBox
                    key={headerState}
                    entering={tradingHistoryDetailEnteringTransition}
                    exiting={tradingHistoryDetailExitingTransition}
                    layout={tradingHistoryDetailLayoutTransition}
                >
                    <SuccessSvg
                        width={size}
                        height={size}
                        testID="@trading-history/detail/header/artwork/success"
                    />
                </AnimatedBox>
            );
        case 'buy-failed':
        case 'sell-failed':
            return (
                <AnimatedBox
                    key={headerState}
                    entering={tradingHistoryDetailEnteringTransition}
                    exiting={tradingHistoryDetailExitingTransition}
                    layout={tradingHistoryDetailLayoutTransition}
                >
                    <FailCrossSvg
                        width={size}
                        height={size}
                        testID="@trading-history/detail/header/artwork/fail"
                    />
                </AnimatedBox>
            );
        case 'exchange-kyc':
            return (
                <AnimatedBox
                    key={headerState}
                    entering={tradingHistoryDetailEnteringTransition}
                    exiting={tradingHistoryDetailExitingTransition}
                    layout={tradingHistoryDetailLayoutTransition}
                >
                    <Box testID="@trading-history/detail/header/artwork/kyc">
                        <Pictogram variant="warning" size={size} />
                    </Box>
                </AnimatedBox>
            );
        case 'buy-processing':
        case 'exchange-processing':
        case 'exchange-returned':
        case 'sell-processing':
            return null;
        default:
            return exhaustive(headerState);
    }
};

export const TradingHistoryDetailHeader = ({ orderId }: TradingHistoryDetailHeaderProps) => {
    const { translate } = useTranslate();
    const { exchange, headerState, tradeType } = useTradingHistoryDetailHeaderState(orderId);
    const providerName = useSelector((state: TradingRootState) =>
        tradeType ? selectTradingProviderCompanyName(state, exchange, tradeType) : undefined,
    );

    if (!headerState) {
        return null;
    }

    return (
        <VStack>
            <TradingHistoryDetailHeaderArtwork
                headerState={headerState}
                size={HEADER_ARTWORK_SIZE}
            />
            <AnimatedBox
                key={headerState}
                entering={tradingHistoryDetailEnteringTransition}
                exiting={tradingHistoryDetailExitingTransition}
                layout={tradingHistoryDetailLayoutTransition}
            >
                <TitleHeader
                    title={<TradingHistoryDetailHeaderTitle headerState={headerState} />}
                    subtitle={
                        <TradingHistoryDetailHeaderSubtitle
                            headerState={headerState}
                            providerName={
                                providerName ??
                                translate(
                                    'moduleTrading.tradeHistory.detail.header.unknownProviderName',
                                )
                            }
                        />
                    }
                    titleVariant="headline-md"
                />
            </AnimatedBox>
        </VStack>
    );
};

export const TradingHistoryDetailCompactHeader = ({ orderId }: TradingHistoryDetailHeaderProps) => {
    const { headerState } = useTradingHistoryDetailHeaderState(orderId);

    if (!headerState) {
        return null;
    }

    return (
        <AnimatedHStack
            alignItems="center"
            spacing="sp8"
            entering={tradingHistoryDetailEnteringTransition}
            exiting={tradingHistoryDetailExitingTransition}
            layout={tradingHistoryDetailLayoutTransition}
        >
            <TradingHistoryDetailHeaderArtwork
                headerState={headerState}
                size={COMPACT_HEADER_ARTWORK_SIZE}
            />
            <AnimatedText
                key={headerState}
                variant="body-md-strong"
                numberOfLines={1}
                adjustsFontSizeToFit
                entering={tradingHistoryDetailEnteringTransition}
                exiting={tradingHistoryDetailExitingTransition}
                layout={tradingHistoryDetailLayoutTransition}
            >
                <TradingHistoryDetailHeaderTitle headerState={headerState} />
            </AnimatedText>
        </AnimatedHStack>
    );
};
