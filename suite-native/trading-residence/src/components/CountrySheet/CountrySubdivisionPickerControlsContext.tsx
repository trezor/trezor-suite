import { createContext, useContext } from 'react';

export type CountrySubdivisionPickerControls = {
    isSheetVisible: boolean;
    hideSheet: () => void;
    showSheet: () => void;
};

const defaultControls: CountrySubdivisionPickerControls = {
    isSheetVisible: false,
    hideSheet: () => {},
    showSheet: () => {},
};

export const CountrySubdivisionPickerControlsContext =
    createContext<CountrySubdivisionPickerControls>(defaultControls);

export const useCountrySubdivisionPickerControls = () =>
    useContext(CountrySubdivisionPickerControlsContext);
