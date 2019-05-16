"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.parseCoinsJson = exports.getCoinName = exports.getCoinInfo = exports.getCoinInfoByHash = exports.fixCoinInfoNetwork = exports.getBech32Network = exports.getSegwitNetwork = exports.getMiscNetwork = exports.getEthereumNetwork = exports.getBitcoinNetwork = exports.cloneCoinInfo = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _pathUtils = require("../utils/pathUtils");

var bitcoinNetworks = [];
var ethereumNetworks = [];
var miscNetworks = [];

var cloneCoinInfo = function cloneCoinInfo(ci) {
  return JSON.parse(JSON.stringify(ci));
};

exports.cloneCoinInfo = cloneCoinInfo;

var getBitcoinNetwork = function getBitcoinNetwork(pathOrName) {
  var networks = cloneCoinInfo(bitcoinNetworks);

  if (typeof pathOrName === 'string') {
    var name = pathOrName.toLowerCase();
    return networks.find(function (n) {
      return n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name || n.label.toLowerCase() === name;
    });
  } else {
    var slip44 = (0, _pathUtils.fromHardened)(pathOrName[1]);
    return networks.find(function (n) {
      return n.slip44 === slip44;
    });
  }
};

exports.getBitcoinNetwork = getBitcoinNetwork;

var getEthereumNetwork = function getEthereumNetwork(pathOrName) {
  var networks = cloneCoinInfo(ethereumNetworks);

  if (typeof pathOrName === 'string') {
    var name = pathOrName.toLowerCase();
    return networks.find(function (n) {
      return n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name;
    });
  } else {
    var slip44 = (0, _pathUtils.fromHardened)(pathOrName[1]);
    return networks.find(function (n) {
      return n.slip44 === slip44;
    });
  }
};

exports.getEthereumNetwork = getEthereumNetwork;

var getMiscNetwork = function getMiscNetwork(pathOrName) {
  var networks = cloneCoinInfo(miscNetworks);

  if (typeof pathOrName === 'string') {
    var name = pathOrName.toLowerCase();
    return networks.find(function (n) {
      return n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name;
    });
  } else {
    var slip44 = (0, _pathUtils.fromHardened)(pathOrName[1]);
    return networks.find(function (n) {
      return n.slip44 === slip44;
    });
  }
};
/*
* Bitcoin networks
*/


exports.getMiscNetwork = getMiscNetwork;

var getSegwitNetwork = function getSegwitNetwork(coin) {
  if (coin.segwit && typeof coin.xPubMagicSegwit === 'number') {
    return (0, _objectSpread2.default)({}, coin.network, {
      bip32: (0, _objectSpread2.default)({}, coin.network.bip32, {
        public: coin.xPubMagicSegwit
      })
    });
  }

  return null;
};

exports.getSegwitNetwork = getSegwitNetwork;

var getBech32Network = function getBech32Network(coin) {
  if (coin.segwit && typeof coin.xPubMagicSegwitNative === 'number') {
    return (0, _objectSpread2.default)({}, coin.network, {
      bip32: (0, _objectSpread2.default)({}, coin.network.bip32, {
        public: coin.xPubMagicSegwitNative
      })
    });
  }

  return null;
}; // fix coinInfo network values from path (segwit/legacy)


exports.getBech32Network = getBech32Network;

var fixCoinInfoNetwork = function fixCoinInfoNetwork(ci, path) {
  var coinInfo = cloneCoinInfo(ci);

  if (path[0] === (0, _pathUtils.toHardened)(49)) {
    var segwitNetwork = getSegwitNetwork(coinInfo);

    if (segwitNetwork) {
      coinInfo.network = segwitNetwork;
    }
  } else {
    coinInfo.segwit = false;
  }

  return coinInfo;
};

exports.fixCoinInfoNetwork = fixCoinInfoNetwork;

var detectBtcVersion = function detectBtcVersion(data) {
  if (data.subversion == null) {
    return 'btc';
  }

  if (data.subversion.startsWith('/Bitcoin ABC')) {
    return 'bch';
  }

  if (data.subversion.startsWith('/Bitcoin Gold')) {
    return 'btg';
  }

  return 'btc';
};

var getCoinInfoByHash = function getCoinInfoByHash(hash, networkInfo) {
  var networks = cloneCoinInfo(bitcoinNetworks);
  var result = networks.find(function (info) {
    return hash.toLowerCase() === info.hashGenesisBlock.toLowerCase();
  });

  if (!result) {
    throw new Error('Coin info not found for hash: ' + hash + ' ' + networkInfo.hashGenesisBlock);
  }

  if (result.isBitcoin) {
    var btcVersion = detectBtcVersion(networkInfo);
    var fork;

    if (btcVersion === 'bch') {
      fork = networks.find(function (info) {
        return info.name === 'Bcash';
      });
    } else if (btcVersion === 'btg') {
      fork = networks.find(function (info) {
        return info.name === 'Bgold';
      });
    }

    if (fork) {
      return fork;
    } else {
      throw new Error('Coin info not found for hash: ' + hash + ' ' + networkInfo.hashGenesisBlock + ' BTC version:' + btcVersion);
    }
  }

  return result;
};

exports.getCoinInfoByHash = getCoinInfoByHash;

var getCoinInfo = function getCoinInfo(currency) {
  var coinInfo = getBitcoinNetwork(currency);

  if (!coinInfo) {
    coinInfo = getEthereumNetwork(currency);
  }

  if (!coinInfo) {
    coinInfo = getMiscNetwork(currency);
  }

  return coinInfo;
};

exports.getCoinInfo = getCoinInfo;

var getCoinName = function getCoinName(path) {
  var slip44 = (0, _pathUtils.fromHardened)(path[1]);

  for (var _i = 0; _i < ethereumNetworks.length; _i++) {
    var network = ethereumNetworks[_i];

    if (network.slip44 === slip44) {
      return network.name;
    }
  }

  return 'Unknown coin';
};

exports.getCoinName = getCoinName;

var parseBitcoinNetworksJson = function parseBitcoinNetworksJson(json) {
  var coinsObject = json;
  Object.keys(coinsObject).forEach(function (key) {
    var coin = coinsObject[key];
    var shortcut = coin.coin_shortcut;
    var isBitcoin = shortcut === 'BTC' || shortcut === 'TEST';
    var hasTimestamp = shortcut === 'CPC';
    var network = {
      messagePrefix: coin.signed_message_header,
      bech32: coin.bech32_prefix,
      bip32: {
        public: coin.xpub_magic,
        private: coin.xprv_magic
      },
      pubKeyHash: coin.address_type,
      scriptHash: coin.address_type_p2sh,
      wif: 0x80,
      // doesn't matter, for type correctness
      dustThreshold: 0,
      // doesn't matter, for type correctness,
      coin: shortcut.toLowerCase(),
      consensusBranchId: coin.consensus_branch_id // zcash, komodo

    };
    bitcoinNetworks.push({
      type: 'bitcoin',
      // address_type in Network
      // address_type_p2sh in Network
      // bech32_prefix in Network
      // consensus_branch_id in Network
      // bip115: not used
      bitcore: coin.bitcore,
      blockbook: coin.blockbook,
      blockchainLink: null,
      blocktime: Math.round(coin.blocktime_seconds / 60),
      cashAddrPrefix: coin.cashaddr_prefix,
      label: coin.coin_label,
      name: coin.coin_name,
      shortcut: shortcut,
      // cooldown not used
      curveName: coin.curve_name,
      // decred not used
      defaultFees: coin.default_fee_b,
      dustLimit: coin.dust_limit,
      forceBip143: coin.force_bip143,
      forkid: coin.fork_id,
      // github not used
      hashGenesisBlock: coin.hash_genesis_block,
      // key not used
      // maintainer not used
      maxAddressLength: coin.max_address_length,
      maxFeeSatoshiKb: coin.maxfee_kb,
      minAddressLength: coin.min_address_length,
      minFeeSatoshiKb: coin.minfee_kb,
      // name: same as coin_label
      segwit: coin.segwit,
      // signed_message_header in Network
      slip44: coin.slip44,
      support: coin.support,
      // uri_prefix not used
      // version_group_id not used
      // website not used
      // xprv_magic in Network
      xPubMagic: coin.xpub_magic,
      xPubMagicSegwitNative: coin.xpub_magic_segwit_native,
      xPubMagicSegwit: coin.xpub_magic_segwit_p2sh,
      // custom
      network: network,
      // bitcoinjs network
      isBitcoin: isBitcoin,
      hasTimestamp: hasTimestamp,
      maxFee: Math.round(coin.maxfee_kb / 1000),
      minFee: Math.round(coin.minfee_kb / 1000),
      // used in backend ?
      blocks: Math.round(coin.blocktime_seconds / 60)
    });
  });
};

var parseEthereumNetworksJson = function parseEthereumNetworksJson(json) {
  var networksObject = json;
  Object.keys(networksObject).forEach(function (key) {
    var network = networksObject[key];
    ethereumNetworks.push({
      type: 'ethereum',
      blockbook: network.blockbook || [],
      bitcore: [],
      // legacy compatibility with bitcoin coinInfo
      blockchainLink: null,
      chain: network.chain,
      chainId: network.chain_id,
      // key not used
      label: network.name,
      name: network.name,
      shortcut: network.shortcut,
      rskip60: network.rskip60,
      slip44: network.slip44,
      support: network.support,
      // url not used
      network: undefined
    });
  });
};

var parseMiscNetworksJSON = function parseMiscNetworksJSON(json) {
  var networksObject = json;
  Object.keys(networksObject).forEach(function (key) {
    var network = networksObject[key];
    miscNetworks.push({
      type: 'misc',
      blockbook: network.blockbook || [],
      // legacy compatibility with bitcoin coinInfo
      bitcore: [],
      // legacy compatibility with bitcoin coinInfo
      blockchainLink: network.blockchain_link,
      curve: network.curve,
      label: network.name,
      name: network.name,
      shortcut: network.shortcut,
      slip44: network.slip44,
      support: network.support,
      network: undefined
    });
  });
};

var parseCoinsJson = function parseCoinsJson(json) {
  var coinsObject = json;
  Object.keys(coinsObject).forEach(function (key) {
    switch (key) {
      case 'bitcoin':
        return parseBitcoinNetworksJson(coinsObject[key]);

      case 'eth':
        return parseEthereumNetworksJson(coinsObject[key]);

      case 'misc':
      case 'nem':
        return parseMiscNetworksJSON(coinsObject[key]);
    }
  });
};

exports.parseCoinsJson = parseCoinsJson;