import { Spinner } from '@trezor/components';
import { borders, spacingsPx, zIndices } from '@trezor/theme';
import styled from 'styled-components';

const CoinmarketFormInputLoaderWrapper = styled.div`
    display: flex;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-radius: ${borders.radii.sm};
    z-index: ${zIndices.base};
    padding: 0 ${spacingsPx.md};
`;

const CoinmarketFormInputLoader = () => {
    return (
        <CoinmarketFormInputLoaderWrapper>
            <Spinner size={24} isGrey={false} />
        </CoinmarketFormInputLoaderWrapper>
    );
};

export default CoinmarketFormInputLoader;
