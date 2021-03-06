const { encode, types: { uint16be } } = require('binary-data')
const constants = require('../constants')
const StunAttribute = require('./stun-attribute')

const MAX_UINT16 = 0xFFFF

const kValue = Symbol('kValue')

module.exports = class StunUInt16Attribute extends StunAttribute {
  constructor(type, value) {
    super(type)

    this[kValue] = 0
    this.setValue(value)
  }

  static from(type, message) {
    return new StunUInt16Attribute(type, message.readUInt16BE(0))
  }

  get value() {
    return this[kValue]
  }

  get valueType() {
    return constants.attributeValueType.UINT16
  }

  setValue(value) {
    if (Number.isSafeInteger(value) && value >= 0 && value <= MAX_UINT16) {
      this[kValue] = value
      return true
    }

    return false
  }

  write(encodeStream) {
    encode(this.value, encodeStream, uint16be)
    return true
  }
}
