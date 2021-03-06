const net = require('net')
const ip = require('ip')
const xor = require('buffer-xor')
const constants = require('../constants')
const StunAddressAttribute = require('./stun-address-attribute')

const kOwner = Symbol('kOwner')

module.exports = class StunXorAddressAttribute extends StunAddressAttribute {
  constructor(type, address, port) {
    super(type, address, port)

    this[kOwner] = null
  }

  static from(type, message, owner) {
    const packet = StunAddressAttribute._read(message)

    const port = xorPort(packet.port)
    const address = xorIP(ip.toString(packet.address), owner)

    const attr = new StunXorAddressAttribute(type, address, port)

    attr.setOwner(owner)
    return attr
  }

  get valueType() {
    return constants.attributeValueType.XOR_ADDRESS
  }

  setOwner(owner) {
    this[kOwner] = owner
  }

  /**
   * Return XORed values
   */
  _valueWrite() {
    const packet = this.value

    packet.port = xorPort(packet.port)

    if (this[kOwner] !== null) {
      packet.address = xorIP(packet.address, this[kOwner])
    }

    return packet
  }
}

function xorPort(port) {
  return port ^ (constants.kStunMagicCookie >> 16)
}

/**
 * @param {string} address
 * @param {StunMessage} owner
 * @returns {string}
 */
function xorIP(address, owner) {
  let func = null

  if (net.isIPv4(address)) {
    func = xorIPv4
  } else if (net.isIPv6(address)) {
    func = xorIPv6
  } else {
    throw new Error('Invalid ip address: ' + address)
  }

  return ip.toString(func(ip.toBuffer(address), owner.transactionId))
}

/**
 * @param {Buffer} address
 * @return {Buffer}
 */
function xorIPv4(address) {
  return xor(address, constants.kStunMagicCookieBuffer)
}

/**
 * @param {Buffer} address
 * @param {Buffer} transactionId
 * @return {Buffer}
 */
function xorIPv6(address, transactionId) {
  return xor(address, Buffer.concat(constants.kStunMagicCookieBuffer, transactionId))
}
