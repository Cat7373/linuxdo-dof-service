import dayjs from 'dayjs'

/**
 * 日志级别
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
/**
 * 日志消息内容
 */
type LogMessage = any

/**
 * 日志工具类
 */
class Log {
  /**
   * 打印一条日志
   */
  log(level: LogLevel, module: string, msg: LogMessage) {
    const time = dayjs().format('MM-DD HH:mm:ss')
    const head = `[${time}] [${level}] [${module}]:`
    let wmsg
    if (Array.isArray(msg)) {
      wmsg = msg
    } else {
      wmsg = [ msg ]
    }

    if (level === 'ERROR') {
      console.log(head, ...wmsg)
    } else if (level === 'WARN') {
      console.log(head, ...wmsg)
    } else if (level === 'DEBUG') {
      console.log(head, ...wmsg)
    } else {
      console.log(head, ...wmsg)
    }
  }

  /**
   * 打印一条调试日志
   */
  debug(module: string, msg: LogMessage) {
    this.log('DEBUG', module, msg)
  }

  /**
   * 打印一条信息日志
   */
  info(module: string, msg: LogMessage) {
    this.log('INFO', module, msg)
  }

  /**
   * 打印一条警告日志
   */
  warn(module: string, msg: LogMessage) {
    this.log('WARN', module, msg)
  }

  /**
   * 打印一条错误日志
   */
  error(module: string, msg: LogMessage) {
    this.log('ERROR', module, msg)
  }
}

const instance = new Log()
export function useLog() {
  return instance
}
