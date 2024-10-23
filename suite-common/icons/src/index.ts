/*
!!! DO NOT RE-EXPORT `icons.ts` HERE. !!!
Please import it directly `@suite-common/icons/src/icons` because otherwise it will include every single icon in mobile bundle.
Mobile app doesn't support treeshaking.
*/
export * from './constants';
export * from './tokenIcons';
export * from './cryptoIcons';
