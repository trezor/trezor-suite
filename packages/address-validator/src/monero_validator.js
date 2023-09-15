const { addressType } = require('./crypto/utils');
var cryptoUtils = require('./crypto/utils')
var cnBase58 = require('./crypto/cnBase58')

var DEFAULT_NETWORK_TYPE = 'prod'
var testnetRegTest = new RegExp(
  `^[A9][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{94}$`
)
var addressRegTest = new RegExp(
  '^4[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{94}$'
)
var subAddressRegTest = new RegExp(
  '^8[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{94}$'
)
var integratedAddressRegTest = new RegExp(
  '^4[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{105}$'
)

function validateNetwork(decoded, currency, networkType, addressType) {
  var network = currency.addressTypes
  if (addressType == 'integrated') {
    network = currency.iAddressTypes
  } else if (addressType == 'subaddress') {
    network = currency.subAddressTypes
  }
  var at = parseInt(decoded.substr(0, 2), 16).toString()

  switch (networkType) {
    case 'prod':
      return network.prod.indexOf(at) >= 0
    case 'testnet':
      return network.testnet.indexOf(at) >= 0
    case 'both':
      return network.prod.indexOf(at) >= 0 || network.testnet.indexOf(at) >= 0
    default:
      return false
  }
}

function hextobin(hex) {
  if (hex.length % 2 !== 0) return null
  var res = new Uint8Array(hex.length / 2)
  for (var i = 0; i < hex.length / 2; ++i) {
    res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return res
}

module.exports = {
  isValidAddress: function(address, currency, networkType) {
    networkType = networkType || DEFAULT_NETWORK_TYPE
    var addressType = 'standard'
    if (networkType === 'testnet') {
      if (!testnetRegTest.test(address)) {
        return false;
      }
    } else if (!addressRegTest.test(address)) {
      if (subAddressRegTest.test(address)) {
        addressType = 'subaddress'
      } else if (integratedAddressRegTest.test(address)) {
        addressType = 'integrated'
      } else {
        return false
      }
    }

    var decodedAddrStr = cnBase58.decode(address)
    if (!decodedAddrStr) return false

    if (!validateNetwork(decodedAddrStr, currency, networkType, addressType)) return false

    var addrChecksum = decodedAddrStr.slice(-8)
    var hashChecksum = cryptoUtils.keccak256Checksum(hextobin(decodedAddrStr.slice(0, -8)))

    return addrChecksum === hashChecksum
  },

  getAddressType: function(address, currency, networkType) {
      if (this.isValidAddress(address, currency, networkType)) {
          return addressType.ADDRESS;
      }
      return undefined;
  },
}
