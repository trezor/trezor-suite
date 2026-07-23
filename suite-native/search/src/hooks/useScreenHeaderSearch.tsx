import { type ComponentProps, type ReactElement, useCallback, useRef, useState } from 'react';

import { Box, IconButton } from '@suite-native/atoms';
import type { Translation } from '@suite-native/intl';
import { type CloseActionType, DynamicScreenHeader } from '@suite-native/navigation';

import { SearchForm } from '../components/SearchForm';

type ScreenHeaderSearchProps = {
    title: ReactElement<ComponentProps<typeof Translation>>;
    subtitle?: ReactElement<ComponentProps<typeof Translation>>;
    closeActionType?: CloseActionType;
    isCompactOnly?: boolean;
    onSearchUsed?: () => void;
};

export const useScreenHeaderSearch = ({
    onSearchUsed,
    ...headerProps
}: ScreenHeaderSearchProps) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const onSearchUsedCalledRef = useRef(false);

    const onPressCancel = useCallback(() => {
        setIsSearchActive(false);
        onSearchUsedCalledRef.current = false;
    }, []);

    const onInputChange = useCallback(
        (value: string) => {
            setSearchQuery(value);
            if (!!value && onSearchUsed && !onSearchUsedCalledRef.current) {
                onSearchUsed();
                onSearchUsedCalledRef.current = true;
            }
        },
        [onSearchUsed],
    );

    const header = isSearchActive ? (
        <Box marginTop="sp8" marginHorizontal="sp16" marginBottom="sp16">
            <SearchForm onPressCancel={onPressCancel} onInputChange={onInputChange} />
        </Box>
    ) : (
        <DynamicScreenHeader
            {...headerProps}
            rightIcon={
                <IconButton
                    iconName="magnifyingGlass"
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    onPress={() => setIsSearchActive(true)}
                />
            }
        />
    );

    return {
        header,
        searchQuery,
    };
};
