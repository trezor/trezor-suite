import { ReactNode } from 'react';
import styled from 'styled-components';
import { Image, Icon, IconProps, variables } from '@trezor/components';
import { useGuide } from 'src/hooks/guide';
import { DeviceModelInternal } from '@trezor/connect';

const Wrapper = styled.div<{ isGuideOpen?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    background: ${({ theme }) => theme.BG_GREY};
    padding: 20px 24px;
    margin-right: 34px;
    width: 100%;
    max-width: 360px;
    border-radius: 5px;

    @media only screen and (max-width: ${props =>
            props.isGuideOpen ? variables.SCREEN_SIZE.XL : variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    flex: 1;
`;

const ItemIconWrapper = styled.div`
    display: flex;
    width: 30px;
    margin-right: 20px;
    justify-content: center;
`;

const ItemText = styled.div`
    width: 100%;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 26px 0;
    text-align: left;
`;

const StyledImage = styled(Image)`
    height: 40px;
`;

interface CommonItemProps {
    key: string;
    title: ReactNode;
}

interface DeviceImageItem extends CommonItemProps {
    deviceModelInternal: DeviceModelInternal;
    icon?: never;
    iconColor?: never;
}

interface IconItem extends CommonItemProps {
    deviceModelInternal?: DeviceModelInternal;
    icon: IconProps['icon'];
    iconColor?: IconProps['color'];
    iconSize?: IconProps['size'];
}

type Item = DeviceImageItem | IconItem;

interface DeviceMatrixExplanationProps {
    items: Item[];
}

export const DeviceMatrixExplanation = ({ items }: DeviceMatrixExplanationProps) => {
    const { isGuideOpen } = useGuide();

    return (
        <Wrapper isGuideOpen={isGuideOpen}>
            {items.map(item => (
                <Item key={item.key}>
                    <ItemIconWrapper>
                        {item.icon ? (
                            <Icon
                                icon={item.icon}
                                color={item.iconColor}
                                size={item.iconSize ?? 26}
                            />
                        ) : (
                            item.deviceModelInternal && (
                                <StyledImage
                                    alt="Trezor"
                                    image={`TREZOR_${item.deviceModelInternal}`}
                                />
                            )
                        )}
                    </ItemIconWrapper>
                    <ItemText>{item.title}</ItemText>
                </Item>
            ))}
        </Wrapper>
    );
};
