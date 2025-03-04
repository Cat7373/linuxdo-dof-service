import process from 'node:process'
import { initProdConfig } from './config/index.js'
import { useHttpService } from './http/index.js'
import { useTasks } from './task/index.js'
import { useLog } from './util/log.js'
import { initDatabase, usePrisma } from './db/index.js'
import { initKnex, useKnex } from './db/knex.js'
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
  const characList = (await useKnex().raw(`SELECT charac_no, HEX(charac_name) AS charac_name FROM taiwan_cain.charac_info WHERE charac_no = ${user.dnfBindCharacId}`))[0][0]
  console.log(user.dnfBindCharacId, user.dnfBindCharacName, characList.charac_name, convertDnfString(characList.charac_name))

  await usePrisma().user.update({
    where: { id: user.id },
    data: { dnfBindCharacName: convertDnfString(characList.charac_name) }
  })
}

// Send ready
useLog().info('Main', '启动完成')
if (process.send) {
  process.send('ready')
}
