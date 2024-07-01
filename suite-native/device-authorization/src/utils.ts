import { AnyAction } from '@reduxjs/toolkit';

export const isPinButtonRequestCode = (action: AnyAction) =>
    action.payload.code === 'ButtonRequest_PinEntry' || // T2 with PIN entry on device
    action.payload.code === 'PinMatrixRequestType_Current'; // T1 with PIN matrix in app
