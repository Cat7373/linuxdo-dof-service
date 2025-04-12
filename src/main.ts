import process from 'node:process'
import { initProdConfig } from './config/index.js'
import { useHttpService } from './http/index.js'
import { useTasks } from './task/index.js'
import { useLog } from './util/log.js'
import { initDatabase } from './db/index.js'
import { initKnex } from './db/knex.js'

// Hook NodeJS
(BigInt.prototype as any).toJSON = function() { return this.toString() }

// 全局异常处理
process.on('uncaughtException', (error) => {
  useLog().error('UncaughtException', error)
})
// 全局 Promise.reject 处理
process.on('unhandledRejection', (reason) => {
  useLog().error('UnhandledRejection', reason)
})

// Startup
await initProdConfig()
await initDatabase()
await initKnex()
await useTasks()
await useHttpService()

// Send ready
useLog().info('Main', '启动完成')
if (process.send) {
  process.send('ready')
}
