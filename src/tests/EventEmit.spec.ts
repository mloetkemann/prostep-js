import { assert } from 'chai'
import EventEmit from '../lib/util/EventEmit'

describe('Event Emitter', () => {
  let called = false
  it('register and trigger Event', async () => {
    called = false
    const emitter = EventEmit.getEmitter()
    emitter.registerEvent('event')
    emitter.on('event', () => (called = true))
    await emitter.trigger('event', { __message: 'Test Event' })
    assert.equal(called, true)
  })
})
