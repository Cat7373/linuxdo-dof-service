import process from 'node:process'
import { initProdConfig } from './config/index.js'
import { useHttpService } from './http/index.js'
import { useTasks } from './task/index.js'
import { useLog } from './util/log.js'
import { initDatabase } from './db/index.js'

(BigInt.prototype as any).toJSON = function() { return this.toString() }

// Startup
await initProdConfig()
await initDatabase()
await useTasks()
await useHttpService()

// Send ready
useLog().info('Main', '启动完成')
if (process.send) {
  process.send('ready')
}
