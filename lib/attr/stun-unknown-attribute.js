const constants = require('../constants')
const StunByteStringAttribute = require('./stun-bytestring-attribute')

module.exports = class StunUnknownAttribute extends StunByteStringAttribute {
  static from(type, message) {
    return new StunUnknownAttribute(type, message)
  }

  get valueType() {
    return constants.attributeValueType.UNKNOWN
  }

  write() {
    return false
  }
}
