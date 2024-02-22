import styled from 'styled-components';
import { Icon } from '@trezor/components';
import { parseTextToPagesAndLines } from './parseTextToPagesAndLines';
import { DeviceDisplayText } from './DeviceDisplayText';
import { DeviceModelInternal } from '@trezor/connect';
import { DisplayPageSeparator } from './DisplayPageSeparator';

const StyledNextIcon = styled(Icon)<{ isPixelType: boolean }>`
    display: inline-block;
    margin-left: ${({ isPixelType }) => (isPixelType ? '12px' : '24px')};
`;

const StyledContinuesIcon = styled(Icon)<{ isPixelType: boolean }>`
    display: inline-block;
    margin-right: ${({ isPixelType }) => (isPixelType ? '12px' : '24px')};
`;

type DisplayPaginatedTextProps = {
    isPixelType: boolean;
    'data-test'?: string;
    text: string;
    device: DeviceModelInternal;
};

export const DisplayPaginatedText = ({
    isPixelType,
    'data-test': dataTest,
    text,
    device,
}: DisplayPaginatedTextProps) => {
    const iconNextName = isPixelType ? 'ADDRESS_PIXEL_NEXT' : 'ADDRESS_NEXT';
    const iconContinuesName = isPixelType ? 'ADDRESS_PIXEL_CONTINUES' : 'ADDRESS_CONTINUES';
    const iconConfig = {
        size: isPixelType ? 10 : 20,
        color: isPixelType ? '#ffffff' : '#959596',
    };

    const { pages, isPrevPageIconOnDevice } = parseTextToPagesAndLines({
        device,
        text,
    });

    const components = [];

    for (let i = 0; i < pages.length; i++) {
        const isFirstPage = i === 0;
        const isLastPage = i === pages.length - 1;
        const page = pages[i];

        components.push(
            <DeviceDisplayText
                key={`text-${i}`}
                isPixelType={isPixelType}
                data-test={isFirstPage ? dataTest : undefined}
            >
                {page.rows.map((row, index) => {
                    const isFirstLine = index === 0;
                    const isLastLine = index === page.rows.length - 1;

                    const showNextPageArrow = isLastLine && !isLastPage;
                    const showPrevPageArrow = isFirstLine && !isFirstPage && isPrevPageIconOnDevice;

                    return (
                        <>
                            {!isFirstLine ? <br /> : null}
                            {showPrevPageArrow ? (
                                <StyledContinuesIcon
                                    {...iconConfig}
                                    isPixelType={isPixelType}
                                    icon={iconContinuesName}
                                />
                            ) : null}
                            {row.text}
                            {showNextPageArrow ? (
                                <StyledNextIcon
                                    {...iconConfig}
                                    isPixelType={isPixelType}
                                    icon={iconNextName}
                                />
                            ) : null}
                        </>
                    );
                })}
            </DeviceDisplayText>,
        );

        if (!isLastPage) {
            components.push(<DisplayPageSeparator key={`separator-${i}`} />);
        }
    }

    return <>{components}</>;
};
