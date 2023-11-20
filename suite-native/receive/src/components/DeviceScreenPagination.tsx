import { Group, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { DeviceModelInternal } from '@trezor/connect';

import { PaginationCompatibleDeviceModel } from '../types';

type DeviceScreenPaginationProps = {
    deviceModel: PaginationCompatibleDeviceModel;
    activePage: 1 | 2;
    isAddressRevealed: boolean;
};

type PaginationModelMetrics = {
    paginationPrefixSvg: string;
    paginationSuffixSvg: string;
    paginatorPrefixX: number;
    paginatorPrefixY: number;
    paginatorSuffixX: number;
    paginatorSuffixY: number;
    pagerSvg1: string;
    pagerSvg2: string;
    pagerX: number;
    pagerY: number;
    paginationSvgWidth: number;
    paginationSvgHeight: number;
};

const deviceModelToSvg = {
    [DeviceModelInternal.T2T1]: {
        paginationPrefixSvg: require('../../assets/addressPaginationPrefixT2T1.svg'),
        paginationSuffixSvg: require('../../assets/addressPaginationSuffixT2T1.svg'),
        paginatorPrefixX: 0,
        paginatorPrefixY: 4,
        paginatorSuffixX: 182.5,
        paginatorSuffixY: 82,

        pagerSvg1: require('../../assets/pager1T2T1.svg'),
        pagerSvg2: require('../../assets/pager2T2T1.svg'),
        pagerX: 260,
        pagerY: 30,
        paginationSvgWidth: 40,
        paginationSvgHeight: 17.5,
    },
    [DeviceModelInternal.T2B1]: {
        paginationPrefixSvg: require('../../assets/addressPaginationPrefixT2B1.svg'),
        paginationSuffixSvg: require('../../assets/addressPaginationSuffixT2B1.svg'),
        paginatorPrefixX: 40,
        paginatorPrefixY: 7.5,
        paginatorSuffixX: 210,
        paginatorSuffixY: 82,
        pagerSvg1: require('../../assets/pager1T2B1.svg'),
        pagerSvg2: require('../../assets/pager2T2B1.svg'),
        pagerX: 277.5,
        pagerY: 0,
        paginationSvgWidth: 12.5,
        paginationSvgHeight: 12.5,
    },
} as const satisfies Record<PaginationCompatibleDeviceModel, PaginationModelMetrics>;

export const DeviceScreenPagination = ({
    deviceModel,
    activePage,
    isAddressRevealed,
}: DeviceScreenPaginationProps) => {
    const {
        paginationPrefixSvg,
        paginationSuffixSvg,
        paginatorPrefixX,
        paginatorPrefixY,
        paginatorSuffixX,
        paginatorSuffixY,
        pagerSvg1,
        pagerSvg2,
        pagerX,
        pagerY,
        paginationSvgHeight,
        paginationSvgWidth,
    } = deviceModelToSvg[deviceModel];
    const paginationSvgPath = activePage === 1 ? paginationSuffixSvg : paginationPrefixSvg;
    const pagerSvgPath = activePage === 1 ? pagerSvg1 : pagerSvg2;

    const paginationX = activePage === 1 ? paginatorSuffixX : paginatorPrefixX;
    const paginationY = activePage === 1 ? paginatorSuffixY : paginatorPrefixY;

    const paginationSvg = useSVG(paginationSvgPath);
    const pagerSvg = useSVG(pagerSvgPath);

    return (
        <Group>
            <ImageSVG svg={pagerSvg} x={pagerX} y={pagerY} />
            {isAddressRevealed && (
                <ImageSVG
                    svg={paginationSvg}
                    x={paginationX}
                    y={paginationY}
                    width={paginationSvgWidth}
                    height={paginationSvgHeight}
                />
            )}
        </Group>
    );
};
