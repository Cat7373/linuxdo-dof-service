import process from 'node:process'
import { initProdConfig } from './config/index.js'
import { useHttpService } from './http/index.js'
import { useTasks } from './task/index.js'
import { useLog } from './util/log.js'
import { initDatabase, usePrisma } from './db/index.js'
import { initKnex } from './db/knex.js'
import { convertDnfString } from './util/index.js'

(BigInt.prototype as any).toJSON = function() { return this.toString() }

// Startup
await initProdConfig()
await initDatabase()
await initKnex()
await useTasks()
await useHttpService()

// 一次性维护：更新所有用户绑定的角色名称
const users = await usePrisma().user.findMany({ where: { dnfBindCharacName: { not: null }}})
for (const user of users) {
  console.log(user.dnfBindCharacId, user.dnfBindCharacName, convertDnfString(user.dnfBindCharacName!))
}

// Send ready
useLog().info('Main', '启动完成')
if (process.send) {
  process.send('ready')
}
