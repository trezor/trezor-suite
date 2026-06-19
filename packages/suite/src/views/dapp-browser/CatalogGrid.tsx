import styled from 'styled-components';

import { DAPP_CATALOG, type DappCatalogEntry } from '@suite/dapp-browser';
import { Card, Paragraph, Text } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    padding: ${spacingsPx.xl};
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: ${spacingsPx.md};
    margin-top: ${spacingsPx.lg};
`;

const Clickable = styled.button`
    text-align: left;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
`;

const Mark = styled.div`
    width: 36px;
    height: 36px;
    border-radius: ${spacingsPx.xs};
    background: ${({ theme }) => theme.elementFillBrandSofter};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    margin-bottom: ${spacingsPx.sm};
`;

type CatalogGridProps = {
    onSelect: (entry: DappCatalogEntry) => void;
};

export const CatalogGrid = ({ onSelect }: CatalogGridProps) => (
    <Wrapper>
        <Paragraph typographyStyle="headline-sm">Apps</Paragraph>
        <Grid>
            {DAPP_CATALOG.map(entry => (
                <Clickable key={entry.id} onClick={() => onSelect(entry)}>
                    <Card>
                        <Mark>{entry.name.charAt(0)}</Mark>
                        <Paragraph typographyStyle="body-md-strong">{entry.name}</Paragraph>
                        <Text typographyStyle="body-sm" intent="neutral">
                            {entry.description}
                        </Text>
                    </Card>
                </Clickable>
            ))}
        </Grid>
    </Wrapper>
);
