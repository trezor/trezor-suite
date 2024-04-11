import styled from 'styled-components';

import { Text, Radio, Button } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useState } from 'react';

type ViewOnlyRadiosProps = {
    isViewOnlyActive: boolean;
    setIsViewOnlyActive: (isViewOnlyActive: boolean) => void;
};
type ViewOnlyRadioProps = {
    title: React.ReactNode;
    children: React.ReactNode;
    onClick: () => void;
    isChecked: boolean;
};
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;
const Left = styled.div``;

const Title = styled.div``;

const Item = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    border-radius: ${borders.radii.md};
    padding: ${spacingsPx.md};
    border: solid 1.5px ${({ theme }) => theme.backgroundSecondaryDefault};
`;

export const ViewOnlyRadio = ({ title, children, onClick, isChecked }: ViewOnlyRadioProps) => {
    return (
        <Item onClick={onClick}>
            <Left>
                <Title>{title}</Title>
                <Text typographyStyle="hint" color="subdued">
                    {children}
                </Text>
            </Left>
            <Radio onClick={onClick} isChecked={isChecked} />
        </Item>
    );
};
export const ViewOnlyRadios = ({ isViewOnlyActive, setIsViewOnlyActive }: ViewOnlyRadiosProps) => {
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
            >
                <Translation
                    id="TR_VIEW_ONLY_RADIOS_DISABLED_DESCRIPTION"
                    values={{
                        strong: chunks => <strong>{chunks}</strong>,
                    }}
                />
            </ViewOnlyRadio>
            <Button size="tiny" onClick={handleConfirm}>
                <Translation id="TR_VIEW_ONLY_RADIOS_CONFIRM" />
            </Button>
        </Container>
    );
};
