import { scheduleJob } from 'node-schedule'
import { useLog } from '../util/log.js'
import { clearSignInRecord } from './tasks/clearSignInRecord.js'
import { clearHackInfo } from './tasks/clearHackInfo.js'

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
  // 每分钟清理封号信息
  safeScheduleJob('clearHackInfo', '0 * * * * *', clearHackInfo)

  useLog().info('Task', 'Task register completed.')
}
