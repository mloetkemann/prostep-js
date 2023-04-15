type EventListenerFunc = (param: EventParameter) => void

export interface EventParameter {
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Map<string, unknown>
}

export default class EventEmit {
  private events = new Map<string, Array<EventListenerFunc>>()
  private static inst: EventEmit

  public static getEmitter() {
    EventEmit.inst = new EventEmit()
    return EventEmit.inst
  }

  private constructor() {
    this.registerEvent('__all') // Event which is triggered if any other event is triggerd
  }

  public registerEvent(event: string) {
    if (!this.events.has(event)) {
      this.events.set(event, new Array<EventListenerFunc>())
    } else {
      throw Error(`Event ${event} already registered`)
    }
  }

  on(event: string, listener: EventListenerFunc) {
    if (!this.events.has(event)) {
      throw Error(`Event ${event} not registered`)
    }
    this.events.get(event)?.push(listener)
  }

  async trigger(event: string, parameter?: object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parameterEntries = new Array<[string, any]>()
    if (parameter) {
      parameterEntries = Object.entries(parameter)
    }

    const param = {
      message: `Event ${event} triggered`,
      args: new Map<string, unknown>(parameterEntries),
    }
    const message = param.args.get('__message')
    if (message && typeof message == 'string') {
      param.message = message
    }

    if (event !== '__all') {
      this.trigger('__all', param)
    }
    const eventListener = this.events.get(event)
    if (eventListener) {
      eventListener.forEach(listener => listener(param))
    }
  }
}
