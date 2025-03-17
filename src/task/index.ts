import { scheduleJob } from 'node-schedule'
import { useLog } from '../util/log.js'
import { clearSignInRecord } from './tasks/clearSignInRecord.js'
import { dofMaintenanceSql10s, dofMaintenanceSql1m, dofMaintenanceSql10m } from './tasks/dofMaintenanceSql.js'
import { restartDocker, setNeedRestartFlag } from './tasks/restartDocker.js'

// 防止重入
const preventReEntryStatus: Map<string, boolean> = new Map()
async function preventReEntry(name: string, code: () => Promise<void>): Promise<void> {
  if (preventReEntryStatus.get(name)) return
  preventReEntryStatus.set(name, true)

  try {
    return await code()
  } finally {
    preventReEntryStatus.set(name, false)
  }
}

/**
 * 注册一个定时任务
 */
function safeScheduleJob(name: string, rule: string, code: () => Promise<void>) {
  scheduleJob(rule, async () => {
    try {
      await preventReEntry(name, code)
    } catch (e) {
      useLog().error('Task', e)
    }
  })
}

/**
 * 注册所有定时任务
 */
export async function useTasks() {
  // 每月初的 00:00:01 清理签到记录
  safeScheduleJob('clearSignInRecord', '1 0 0 1 * *', clearSignInRecord)
  // 维护 DOF 数据库
  safeScheduleJob('dofMaintenanceSql10s', '0 * * * * *', dofMaintenanceSql10s)
  safeScheduleJob('dofMaintenanceSql1m', '0 * * * * *', dofMaintenanceSql1m)
  safeScheduleJob('dofMaintenanceSql10m', '0 * * * * *', dofMaintenanceSql10m)
  // 每 10 分钟一次，若当天还没重启过，且服务器无人，则重启一次 Docker 镜像
  safeScheduleJob('setNeedRestartFlag', '0 0 0 * * *', setNeedRestartFlag)
  safeScheduleJob('restartDocker', '0 */10 * * * *', restartDocker)

  useLog().info('Task', 'Task register completed.')
}
