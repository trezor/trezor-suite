import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { differenceInMonths, endOfToday, startOfDay, subDays, subMonths, subYears } from 'date-fns';

import { Translation } from '@suite/intl';
import { getCoingeckoId } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type GraphFiatResolution } from '@suite-common/wallet-types';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import {
    Popover,
    type PopoverPlacement,
    Row,
    SelectBar,
    Spinner,
    Timerange,
    Tooltip,
} from '@trezor/components';

import { evictPrefetchedGraphData, prefetchGraphData } from 'src/actions/wallet/graphActions';
import {
    ensureGraphFiatRates,
    removeGraphFiatResolutionsFromMemory,
} from 'src/actions/wallet/graphFiatActions';
import { useDispatch, useGraph, useLocales, useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import { type GraphRange } from 'src/types/wallet/graph';
import { getRequiredGraphFiatResolution } from 'src/views/dashboard/PortfolioCard/usePriceHistory';

const getRanges = () => {
    const now = new Date();
    const endOfCurrentDay = endOfToday();

    return [
        {
            label: 'day',
            startDate: startOfDay(now),
            endDate: endOfCurrentDay,
            groupBy: 'day',
        },
        {
            label: 'week',
            startDate: startOfDay(subDays(endOfCurrentDay, 7)),
            endDate: endOfCurrentDay,
            groupBy: 'day',
        },
        {
            label: 'month',
            startDate: startOfDay(subMonths(endOfCurrentDay, 1)),
            endDate: endOfCurrentDay,
            groupBy: 'day',
        },
        {
            label: 'year',
            startDate: startOfDay(subYears(endOfCurrentDay, 1)),
            endDate: endOfCurrentDay,
            groupBy: 'month',
        },
        {
            label: 'all',
            startDate: null,
            endDate: null,
            groupBy: 'month',
        },
    ] as const;
};

const CUSTOM_RANGE_LABEL = 'range';

const getFormattedLabel = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'all':
            return <Translation id="TR_ALL" />;
        case 'range':
            return <Translation id="TR_RANGE" />;
        case 'year':
            return <Translation id="TR_DATE_YEAR_SHORT" />;
        case 'month':
            return <Translation id="TR_DATE_MONTH_SHORT" />;
        case 'week':
            return <Translation id="TR_DATE_WEEK_SHORT" />;
        case 'day':
            return <Translation id="TR_DATE_DAY_SHORT" />;
        default:
            return rangeLabel;
    }
};

interface GraphRangeSelectorProps {
    onSelectedRange?: (range: GraphRange) => void;
    isLive?: boolean;
    isLoading?: boolean;
    isDisabled?: boolean;
    onLiveChange?: (isLive: boolean) => void;
    showLiveOption?: boolean;
    liveTooltipContent?: ReactNode;
    accounts?: Account[];
    prefetchDelay?: number;
    showCustomRangeOption?: boolean;
    placement?: PopoverPlacement;
}

export const GraphRangeSelector = ({
    onSelectedRange,
    isLive = false,
    isLoading = false,
    isDisabled = false,
    onLiveChange,
    showLiveOption = false,
    liveTooltipContent,
    accounts,
    prefetchDelay = 100,
    showCustomRangeOption = false,
    placement,
}: GraphRangeSelectorProps) => {
    const { selectedRange, setSelectedRange } = useGraph();
    const dispatch = useDispatch();
    const locale = useLocales();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const [customTimerangeStart, setCustomTimerangeStart] = useState<Date>();
    const [customTimerangeEnd, setCustomTimerangeEnd] = useState<Date>();
    const [isCustomRangePickerOpen, setIsCustomRangePickerOpen] = useState(false);
    const graphFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';

    // Anchor ranges once per mount. They drift past midnight if the selector
    // stays mounted overnight, which is an acceptable trade for stable option
    // identity (avoids re-rendering SelectBar and churning Redux Date refs).
    const ranges = useMemo(() => getRanges(), []);
    const options = useMemo(
        () => [
            ...(showLiveOption
                ? [
                      {
                          label: liveTooltipContent ? (
                              <Tooltip content={liveTooltipContent} hasIcon as="span">
                                  <span>
                                      <Translation id="TR_GRAPH_LIVE" />
                                  </span>
                              </Tooltip>
                          ) : (
                              <Translation id="TR_GRAPH_LIVE" />
                          ),
                          value: 'live',
                      },
                  ]
                : []),
            ...ranges.map(range => ({
                label: getFormattedLabel(range.label),
                value: range.label,
            })),
            ...(showCustomRangeOption
                ? [
                      {
                          label: getFormattedLabel(CUSTOM_RANGE_LABEL),
                          value: CUSTOM_RANGE_LABEL,
                      },
                  ]
                : []),
        ],
        [ranges, showLiveOption, liveTooltipContent, showCustomRangeOption],
    );

    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prefetchFiatTargetRef = useRef<{
        value: string;
        resolution: GraphFiatResolution;
        coinIds: string[];
        shouldEvictOnCompletion: boolean;
    } | null>(null);
    const prefetchFiatCompletedRef = useRef(false);
    const selectedResolution = getRequiredGraphFiatResolution(selectedRange);
    const selectedResolutionRef = useRef(selectedResolution);

    selectedResolutionRef.current = selectedResolution;

    useEffect(
        () => () => {
            if (hoverTimerRef.current !== null) {
                clearTimeout(hoverTimerRef.current);
            }
        },
        [],
    );

    const evictPrefetchedFiatTarget = () => {
        if (!prefetchFiatTargetRef.current) {
            return;
        }

        const { resolution, coinIds } = prefetchFiatTargetRef.current;

        if (resolution !== selectedResolutionRef.current) {
            dispatch(
                removeGraphFiatResolutionsFromMemory(
                    coinIds.map(coinId => ({
                        baseCurrencyCode: graphFiatCurrencyCode,
                        coinId,
                        resolution,
                    })),
                ),
            );
        }
    };

    const clearPrefetchedFiatTarget = () => {
        prefetchFiatTargetRef.current = null;
        prefetchFiatCompletedRef.current = false;
    };

    const handleMouseEnter = (value: string) => {
        if (hoverTimerRef.current !== null) {
            clearTimeout(hoverTimerRef.current);
        }

        if (isDisabled) return;
        if (
            !accounts ||
            value === 'live' ||
            value === CUSTOM_RANGE_LABEL ||
            value === selectedRange.label
        ) {
            return;
        }

        if (prefetchFiatTargetRef.current && prefetchFiatTargetRef.current.value !== value) {
            if (prefetchFiatCompletedRef.current) {
                evictPrefetchedFiatTarget();
                clearPrefetchedFiatTarget();
            } else {
                prefetchFiatTargetRef.current.shouldEvictOnCompletion = true;
            }
        }

        hoverTimerRef.current = setTimeout(() => {
            hoverTimerRef.current = null;
            const range = ranges.find(r => r.label === value);
            if (!range || accounts.length === 0) return;

            dispatch(
                prefetchGraphData({
                    accounts,
                    selectedRange: range,
                }),
            );

            const resolution = getRequiredGraphFiatResolution(range);
            if (resolution === selectedResolution) {
                clearPrefetchedFiatTarget();

                return;
            }

            const coinIds = accounts.map(a => getCoingeckoId(a.symbol)).filter(Boolean) as string[];
            if (coinIds.length === 0) return;

            prefetchFiatTargetRef.current = {
                value,
                resolution,
                coinIds,
                shouldEvictOnCompletion: false,
            };
            prefetchFiatCompletedRef.current = false;
            dispatch(
                ensureGraphFiatRates({
                    baseCurrencyCode: graphFiatCurrencyCode,
                    coinIds,
                    resolution,
                }),
            ).then(() => {
                if (prefetchFiatTargetRef.current?.value !== value) {
                    return;
                }

                prefetchFiatCompletedRef.current = true;
                if (prefetchFiatTargetRef.current.shouldEvictOnCompletion) {
                    evictPrefetchedFiatTarget();
                    clearPrefetchedFiatTarget();
                }
            });
        }, prefetchDelay);
    };

    const handleMouseLeave = (value: string) => {
        if (hoverTimerRef.current !== null) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;

            return;
        }

        if (isDisabled) return;
        if (prefetchFiatTargetRef.current?.value === value) {
            if (prefetchFiatCompletedRef.current) {
                evictPrefetchedFiatTarget();
                clearPrefetchedFiatTarget();
            } else {
                prefetchFiatTargetRef.current.shouldEvictOnCompletion = true;
            }
        }

        const range = ranges.find(r => r.label === value);
        if (accounts && range) {
            dispatch(
                evictPrefetchedGraphData({
                    accounts,
                    selectedRange: range,
                }),
            );
        }
    };

    const clearCustomTimerange = () => {
        setCustomTimerangeStart(undefined);
        setCustomTimerangeEnd(undefined);
    };

    const setCustomTimerange = (startDate: Date, endDate: Date) => {
        setCustomTimerangeStart(startDate);
        setCustomTimerangeEnd(endDate);

        const range: GraphRange = {
            label: CUSTOM_RANGE_LABEL,
            startDate,
            endDate,
            groupBy: differenceInMonths(endDate, startDate) <= 1 ? 'day' : 'month',
        };

        onLiveChange?.(false);
        setSelectedRange(range);
        onSelectedRange?.(range);
        setIsCustomRangePickerOpen(false);
    };

    let selectedOption: string = selectedRange.label;
    if (showLiveOption && isLive) {
        selectedOption = 'live';
    }
    if (showCustomRangeOption && isCustomRangePickerOpen) {
        selectedOption = CUSTOM_RANGE_LABEL;
    }

    const rangeSelector = (
        <Row gap={16} alignItems="center">
            <SelectBar
                size="small"
                data-testid="@graph/range-selector"
                selectedOption={selectedOption}
                options={options}
                isDisabled={isDisabled}
                onMouseEnter={accounts ? handleMouseEnter : undefined}
                onMouseLeave={accounts ? handleMouseLeave : undefined}
                onOptionClick={
                    showCustomRangeOption
                        ? selectedLabel => {
                              if (selectedLabel === CUSTOM_RANGE_LABEL) {
                                  setIsCustomRangePickerOpen(true);
                              }
                          }
                        : undefined
                }
                onChange={selectedLabel => {
                    if (isDisabled) {
                        return;
                    }

                    if (hoverTimerRef.current !== null) {
                        clearTimeout(hoverTimerRef.current);
                        hoverTimerRef.current = null;
                    }
                    prefetchFiatTargetRef.current = null;
                    prefetchFiatCompletedRef.current = false;

                    if (selectedLabel === 'live') {
                        onLiveChange?.(true);

                        return;
                    }

                    if (selectedLabel === CUSTOM_RANGE_LABEL) {
                        return;
                    }

                    const range = ranges.find(({ label }) => label === selectedLabel);
                    if (!range) {
                        return;
                    }

                    onLiveChange?.(false);
                    setIsCustomRangePickerOpen(false);
                    setSelectedRange(range);
                    clearCustomTimerange();
                    onSelectedRange?.(range);
                }}
            />
            {isLoading && <Spinner size={32} isDisabled={true} />}
        </Row>
    );

    if (!showCustomRangeOption) {
        return rangeSelector;
    }

    return (
        <Popover
            isOpen={isCustomRangePickerOpen}
            onOpenChange={setIsCustomRangePickerOpen}
            placement={placement ?? { position: 'bottom', alignment: 'start' }}
            content={
                <Timerange
                    onSubmit={(startDate: Date, endDate: Date) =>
                        setCustomTimerange(startDate, endDate)
                    }
                    startDate={customTimerangeStart}
                    endDate={customTimerangeEnd}
                    onCancel={() => setIsCustomRangePickerOpen(false)}
                    ctaSubmit={<Translation id="TR_CONFIRM" />}
                    ctaCancel={<Translation id="TR_CANCEL" />}
                    locale={locale}
                />
            }
        >
            {rangeSelector}
        </Popover>
    );
};
