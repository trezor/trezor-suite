import styled from 'styled-components';
import { Icon } from '@trezor/components';
import { ResultRow, parseTextToPagesAndLines } from './parseTextToPagesAndLines';
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

const Container = styled.div`
    text-align: left;
`;

type DisplayPaginatedTextProps = {
    isPixelType: boolean;
    'data-test'?: string;
    text: string;
    deviceModel: DeviceModelInternal;
};

type PageProps = {
    isPrevPageIconOnDevice: boolean;
    isPixelType: boolean;
    isFirstLine: boolean;
    isLastLine: boolean;
    row: ResultRow;
    isFirstPage: boolean;
    isLastPage: boolean;
    'data-test'?: string;
};

const Page = styled.div``;
const RowContainer = styled.div``;

const Row = ({
    isFirstPage,
    isLastPage,
    isFirstLine,
    isLastLine,
    isPixelType,
    isPrevPageIconOnDevice,
    row,
    'data-test': dataTest,
}: PageProps) => {
    const iconNextName = isPixelType ? 'ADDRESS_PIXEL_NEXT' : 'ADDRESS_NEXT';
    const iconContinuesName = isPixelType ? 'ADDRESS_PIXEL_CONTINUES' : 'ADDRESS_CONTINUES';
    const iconConfig = {
        size: isPixelType ? 10 : 20,
        color: isPixelType ? '#ffffff' : '#959596',
    };

    const showNextPageArrow = isLastLine && !isLastPage;
    const showPrevPageArrow = isFirstLine && !isFirstPage && isPrevPageIconOnDevice;

    return (
        <RowContainer>
            {showPrevPageArrow && (
                <StyledContinuesIcon
                    {...iconConfig}
                    isPixelType={isPixelType}
                    icon={iconContinuesName}
                />
            )}
            <DeviceDisplayText
                isPixelType={isPixelType}
                data-test={isFirstPage ? dataTest : undefined}
            >
                {row.text}
            </DeviceDisplayText>
            {showNextPageArrow && (
                <StyledNextIcon {...iconConfig} isPixelType={isPixelType} icon={iconNextName} />
            )}
        </RowContainer>
    );
};

export const DisplayPaginatedText = ({
    isPixelType,
    'data-test': dataTest,
    text,
    deviceModel,
}: DisplayPaginatedTextProps) => {
    const { pages, hasNextIcon: isPrevPageIconOnDevice } = parseTextToPagesAndLines({
        deviceModel,
        text,
    });

    return (
        <Container>
            {pages.map((page, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === pages.length - 1;

                return (
                    <Page key={`page-${pageIndex}`}>
                        {page.rows.map((row, index) => (
                            <Row
                                isPrevPageIconOnDevice={isPrevPageIconOnDevice}
                                isPixelType={isPixelType}
                                row={row}
                                isFirstLine={index === 0}
                                isLastLine={index === page.rows.length - 1}
                                key={`row-${index}`}
                                isFirstPage={isFirstPage}
                                isLastPage={isLastPage}
                                data-test={dataTest}
                            />
                        ))}
                        {!isLastPage && <DisplayPageSeparator key={`separator-${pageIndex}`} />}
                    </Page>
                );
            })}
        </Container>
    );
};
