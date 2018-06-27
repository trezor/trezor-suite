// this is idiotic, but flow doesn't work otherwise
// (I can also add whole node_modules, but that takes FOREVER)


declare module 'whatwg-fetch' {
}

declare module 'socket.io-client' {
  declare var exports: any;
}

declare module 'queue' {
  declare var exports: Function;
}

declare module 'bchaddrjs' {
  declare module.exports: {
      toCashAddress(address: string): string;
      isCashAddress(address: string): string;
      toLegacyAddress(address: string): string;
  };
}
