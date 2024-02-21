import styled from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { Translation } from '../Translation';
import { parseTextToPagesAndLines } from './parseTextToPagesAndLines';
import { DeviceDisplayText } from './DeviceDisplayText';
import { DeviceModelInternal } from '@trezor/connect';

const StyledNextIcon = styled(Icon)<{ isPixelType: boolean }>`
    display: inline-block;
    margin-left: ${({ isPixelType }) => (isPixelType ? '2px' : '24px')};
`;

const StyledContinuesIcon = styled(Icon)<{ isPixelType: boolean }>`
    display: inline-block;
    margin-right: ${({ isPixelType }) => (isPixelType ? '2px' : '24px')};
`;

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 32px;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: #2b2b2b;
    margin: 0;
`;

const AddressLabel = styled.span`
    font-weight: 600;
    color: #808080;
    font-size: ${variables.FONT_SIZE.TINY};
    text-transform: uppercase;
    position: relative;
    background: #000;
    padding: 0 10px;
    text-align: center;
    left: 50%;
    bottom: -7px;
    transform: translate(-50%, 0);
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

    const { pages } = parseTextToPagesAndLines({ device, text });

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
                    const isFirstLine = index !== 0;
                    const isLastLine = index === page.rows.length - 1;

                    return (
                        <>
                            {isFirstLine ? <br /> : null}
                            {isFirstLine && !isFirstPage ? (
                                <StyledContinuesIcon
                                    {...iconConfig}
                                    isPixelType={isPixelType}
                                    icon={iconContinuesName}
                                />
                            ) : null}
                            {row.text}
                            {isLastLine && !isLastPage ? (
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
            components.push(
                <Wrapper key={`separator-${i}`}>
                    <Divider />
                    <AddressLabel>
                        <Translation id="NEXT_PAGE" />
                    </AddressLabel>
                </Wrapper>,
            );
        }
    }

    return <>{components}</>;
};
