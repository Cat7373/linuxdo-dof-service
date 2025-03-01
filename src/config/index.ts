import { useLog } from '../util/log.js'

/**
 * 服务配置(默认内容为 Dev 配置，生产环境通过启动参数和配置文件覆盖)
 */
const config = {
  // 是否开启调试（注意：会产生大量日志）
  debug: false,
  // HTTP 配置
  http: {
    port: 8652,
    listen: '127.0.0.1',
    sessionTimeoutDays: 7,
  },
  // 注册送多少点卷
  registerCash: 8888,
  // 签到奖励设置
  signInReward: {
    // 每日签到奖励的点卷
    dailyCash: 1000,
    // 每月签到满多少天额外奖励多少点卷
    cumulativeCash: {
      3: 666,
      7: 2024,
      10: 117,
      14: 6666,
      20: 8888,
      26: 10000,
    } as Record<number, number>,
  },
}
export default config

/**
 * 初始化生产环境配置
 */
export async function initProdConfig() {
  const prodName = process.argv[2]
  if (prodName) { // 生产环境
    useLog().info('Config', `Use prod config ${prodName}.`)
  } else { // 开发环境
    useLog().info('Config', 'Use dev config.')
  }

  // 输出配置内容
  useLog().info('Config', JSON.stringify(config))
}
