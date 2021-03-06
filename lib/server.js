const Emitter = require('events')
const isStun = require('is-stun')
const StunMessage = require('./message')
const constants = require('./constants')

const EVENT_BINDING_REQUEST = 'bindingRequest'
const EVENT_BINDING_INDICATION = 'bindingIndication'
const EVENT_BINDING_RESPONSE = 'bindingResponse'
const EVENT_BINDING_ERROR_RESPONSE = 'bindingError'

const isStunRequest = 0
const isStunIndication = 0x010
const isStunSuccessResponse = 0x100
const isStunErrorResponse = 0x110

const kSocket = Symbol('kSocket')
const kHandleMessage = Symbol('kHandleMessage')
const kHandleClose = Symbol('kHandleClose')
const _closed = Symbol('_closed')
const _handleMessage = Symbol('_handleMessage')

// This class imlplements a STUN server.
module.exports = class StunServer extends Emitter {
  constructor(socket) {
    super()

    this[kSocket] = socket
    this[kHandleMessage] = this[_handleMessage].bind(this)
    this[kHandleClose] = this.close.bind(this)

    socket.on('message', this[kHandleMessage])
    socket.once('close', this[kHandleClose])
  }

  /**
   * @private
   * @return {boolean}
   */
  get [_closed]() {
    return this[kSocket] === null
  }

  /**
   * Handles arrived a STUN message.
   * @param {Buffer} msg
   * @param {object} rinfo
   */
  process(msg, rinfo) {
    const stunMsg = StunMessage.from(msg)

    switch (stunMsg.type & constants.kStunTypeMask) {
      case isStunRequest:
        this.emit(EVENT_BINDING_REQUEST, stunMsg, rinfo)
        break
      case isStunIndication:
        this.emit(EVENT_BINDING_INDICATION, stunMsg, rinfo)
        break
      case isStunSuccessResponse:
        this.emit(EVENT_BINDING_RESPONSE, stunMsg, rinfo)
        break
      case isStunErrorResponse:
        this.emit(EVENT_BINDING_ERROR_RESPONSE, stunMsg, rinfo)
        break
      default:
        break
    }
  }

  /**
   * @private
   * @param {Buffer} msg
   * @param {object} rinfo
   */
  [_handleMessage](msg, rinfo) {
    if (!isStun(msg)) {
      return
    }

    this.process(msg, rinfo)
  }

  /**
   * Sends the StunMessage message.
   *
   * @param {StunMessage} stunMsg
   * @param {number} port - remote port.
   * @param {string} address - remote address.
   * @param {function} [callback]
   */
  send(stunMsg, port, address, callback) {
    if (this[_closed]) {
      return false
    }

    if (!(stunMsg instanceof StunMessage)) {
      return false
    }

    this[kSocket].send(stunMsg.toBuffer(), port, address, callback)
    return true
  }

  /**
   * Close a STUN server.
   */
  close() {
    if (this[_closed]) {
      return
    }

    this[kSocket].removeListener('message', this[kHandleMessage])
    this[kSocket].removeListener('close', this[kHandleClose])

    this[kSocket] = null
    this.emit('close')
  }
}
