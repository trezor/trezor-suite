import { useSelector } from 'src/hooks/suite';

export const useLayoutSize = () => {
    const layoutSize = useSelector(state => state.resize.size);
    const isMobileLayout = !['XLARGE', 'LARGE', 'NORMAL'].includes(layoutSize);

    return { isMobileLayout, layoutSize };
};
