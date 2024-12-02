import { useSelector } from 'src/hooks/suite';
import { selectWindowSize } from 'src/reducers/suite/windowReducer';

export const useLayoutSize = () => {
    const layoutSize = useSelector(selectWindowSize);
    const isMobileLayout = !['XLARGE', 'LARGE', 'NORMAL'].includes(layoutSize);

    return { isMobileLayout, layoutSize };
};
