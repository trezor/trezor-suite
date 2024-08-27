import styled from 'styled-components';

import { DeviceModelInternal } from '@trezor/connect';

import { ResultRow, parseTextToPagesAndLines } from './parseTextToPagesAndLines';
import { DeviceDisplayText } from './DeviceDisplayText';
import { DisplayPageSeparator } from './DisplayPageSeparator';
import { handleOnCopy } from 'src/utils/suite/deviceDisplay';
import { Icon, IconName } from '@trezor/components';

const StyledNextIcon = styled(Icon)<{ $isPixelType: boolean }>`
    display: inline-block;
    margin-left: ${({ $isPixelType }) => ($isPixelType ? '12px' : '24px')};
`;

const StyledContinuesIcon = styled(Icon)<{ $isPixelType: boolean }>`
    display: inline-block;
    margin-right: ${({ $isPixelType }) => ($isPixelType ? '12px' : '24px')};
`;

const Container = styled.div`
    text-align: left;
`;

type DisplayPaginatedTextProps = {
    isPixelType: boolean;
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
}: PageProps) => {
    const iconNextName: IconName = isPixelType ? 'addressPixelNext' : 'addressNext';
    const iconContinuesName: IconName = isPixelType ? 'addressPixelContinues' : 'addressContinues';

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
                    $isPixelType={isPixelType}
                    name={iconContinuesName}
                />
            )}
            <DeviceDisplayText $isPixelType={isPixelType}>{row.text}</DeviceDisplayText>
            {showNextPageArrow && (
                <StyledNextIcon {...iconConfig} $isPixelType={isPixelType} name={iconNextName} />
            )}
        </RowContainer>
    );
};

export const DisplayPaginatedText = ({
    isPixelType,
    text,
    deviceModel,
}: DisplayPaginatedTextProps) => {
    const { pages, hasNextIcon: isPrevPageIconOnDevice } = parseTextToPagesAndLines({
        deviceModel,
        text,
    });

    return (
        <Container onCopy={handleOnCopy}>
            {pages.map((page, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === pages.length - 1;

                return (
                    <Page
                        key={`page-${pageIndex}`}
                        data-testid={isFirstPage ? '@device-display/paginated-text' : undefined}
                    >
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
                            />
                        ))}
                        {!isLastPage && <DisplayPageSeparator key={`separator-${pageIndex}`} />}
                    </Page>
                );
            })}
        </Container>
    );
};
