/* eslint-disable @typescript-eslint/no-explicit-any */
import log, { Logger as npmLogger } from 'npmlog'

log.level = 'verbose'

interface LogHandler {
  debug(message: string, ...args: any[]): void

  info(message: string, ...args: any[]): void

  warn(message: string, ...args: any[]): void

  verbose(message: string, ...args: any[]): void

  error(message: string, ...args: any[]): void

  silly(message: string, ...args: any[]): void
}

class DefaultLogHandler implements LogHandler {
  private console: npmLogger
  private component: string
  constructor(component = 'DEFAULT') {
    this.console = log
    this.component = component
  }

  debug(message: string, ...args: any[]): void {
    return this.verbose(this.component, message, args)
  }

  info(message: string, ...args: any[]) {
    return this.console.info(this.component, message, args)
  }

  verbose(message: string, ...args: any[]) {
    return this.console.verbose(this.component, message, args)
  }

  warn(message: string, ...args: any[]) {
    return this.console.warn(this.component, message, args)
  }

  error(message: string, ...args: any[]) {
    return this.console.error(this.component, message, args)
  }

  silly(message: string, ...args: any[]) {
    return this.console.silly(this.component, message, args)
  }
}

export default class Logger {
  private logHandlerList = Array<LogHandler>()
  private static loggerInstances = new Array<Logger>()

  constructor(private name: string, logHandlerList?: LogHandler[]) {
    if (logHandlerList) {
      this.logHandlerList.concat(logHandlerList)
    }

    if (this.logHandlerList.length == 0) {
      this.logHandlerList.push(new DefaultLogHandler(name))
    }
  }

  getName(): string {
    return this.name
  }

  debug(message: string, ...args: any[]): void {
    this.logHandlerList.forEach(handler => handler.debug(message, args))
  }

  info(message: string, ...args: any[]) {
    this.logHandlerList.forEach(handler => handler.info(message, args))
  }

  verbose(message: string, ...args: any[]) {
    this.logHandlerList.forEach(handler => handler.verbose(message, args))
  }

  warn(message: string, ...args: any[]) {
    this.logHandlerList.forEach(handler => handler.warn(message, args))
  }

  error(message: string, ...args: any[]) {
    this.logHandlerList.forEach(handler => handler.error(message, args))
  }

  silly(message: string, ...args: any[]) {
    this.logHandlerList.forEach(handler => handler.silly(message, args))
  }

  trace(message: string, error: any, ...args: any[]) {
    this.error(message, args)
    if (error instanceof Error) {
      this.error(error.message)
      if (error.stack) this.verbose(error.stack)
    }
  }

  public static getLogger(name: string, logHandlerList?: LogHandler[]) {
    const instance = Logger.loggerInstances.find(el => el.getName() == name)
    if (instance) {
      return instance
    }

    const newLogger = new Logger(name, logHandlerList)
    Logger.loggerInstances.push(newLogger)
    return newLogger
  }
}
