import styled from 'styled-components';

import { Text, Radio, Button, Icon, useElevation } from '@trezor/components';
import { Elevation, borders, mapElevationToBorder, spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useState } from 'react';

type ViewOnlyRadiosProps = {
    isViewOnlyActive: boolean;
    setIsViewOnlyActive: (isViewOnlyActive: boolean) => void;
    dataTest?: string;
};
type ViewOnlyRadioProps = {
    title: React.ReactNode;
    children: React.ReactNode;
    onClick: () => void;
    isChecked: boolean;
    dataTest?: string;
};
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;
const Left = styled.div``;

const Title = styled.div``;
const ConfirmButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Item = styled.div<{ $elevation: Elevation; $isChecked: boolean }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    border-radius: ${borders.radii.md};
    padding: ${spacingsPx.md};
    border: solid 1.5px
        ${({ theme, $isChecked, $elevation }) =>
            $isChecked
                ? theme.backgroundSecondaryDefault
                : mapElevationToBorder({ theme, $elevation })};
`;

const SendCoinsInfo = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    margin: ${spacingsPx.md} auto;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
`;

export const ViewOnlyRadio = ({
    title,
    children,
    onClick,
    isChecked,
    dataTest,
}: ViewOnlyRadioProps) => {
    const { elevation } = useElevation();

    return (
        <Item onClick={onClick} $elevation={elevation} $isChecked={isChecked}>
            <Left>
                <Title>{title}</Title>
                <Text typographyStyle="hint" color="subdued">
                    {children}
                </Text>
            </Left>
            <Radio onClick={onClick} isChecked={isChecked} data-test={dataTest} />
        </Item>
    );
};
export const ViewOnlyRadios = ({
    isViewOnlyActive,
    setIsViewOnlyActive,
    dataTest,
}: ViewOnlyRadiosProps) => {
    const [isViewOnlyActiveTemp, setIsViewOnlyActiveTemp] = useState(isViewOnlyActive);
    const handleConfirm = () => {
        setIsViewOnlyActive(isViewOnlyActiveTemp);
    };

    return (
        <Container>
            <ViewOnlyRadio
                title={<Translation id="TR_VIEW_ONLY_RADIOS_ENABLED_TITLE" />}
                onClick={() => setIsViewOnlyActiveTemp(true)}
                isChecked={isViewOnlyActiveTemp}
                dataTest={`${dataTest}/enabled`}
            >
                <Translation
                    id="TR_VIEW_ONLY_RADIOS_ENABLED_DESCRIPTION"
                    values={{
                        strong: chunks => <strong>{chunks}</strong>,
                    }}
                />
            </ViewOnlyRadio>
            <ViewOnlyRadio
                title={<Translation id="TR_VIEW_ONLY_RADIOS_DISABLED_TITLE" />}
                onClick={() => setIsViewOnlyActiveTemp(false)}
                isChecked={!isViewOnlyActiveTemp}
                dataTest={`${dataTest}/disabled`}
            >
                <Translation
                    id="TR_VIEW_ONLY_RADIOS_DISABLED_DESCRIPTION"
                    values={{
                        strong: chunks => <strong>{chunks}</strong>,
                    }}
                />
            </ViewOnlyRadio>
            <ConfirmButtonContainer>
                <Button size="small" onClick={handleConfirm}>
                    <Translation id="TR_VIEW_ONLY_RADIOS_CONFIRM" />
                </Button>
            </ConfirmButtonContainer>

            <SendCoinsInfo>
                <Icon icon="INFO" size={12} />
                <Translation id="TR_VIEW_ONLY_SEND_COINS_INFO" />
            </SendCoinsInfo>
        </Container>
    );
};
