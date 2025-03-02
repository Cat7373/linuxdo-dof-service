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
    sessionTimeoutDays: 5,
  },
  // 注册送多少点卷
  registerCash: 8888,
  // 签到奖励设置
  signInReward: {
    // 每日签到奖励的点卷
    dailyCash: 1234,
    // 每月签到满多少天额外奖励多少点卷 (奖励多少，前端显示什么，需要几级信任等级来领取)
    cumulativeCash: {
      // 所有用户均可领取
      3: [666, '666', 2],
      7: [2024, '2024', 2],
      10: [117, '0117', 2],
      14: [6666, '6666', 2],
      20: [8888, '8888', 2],
      26: [12345, '12345', 2],

      // 三级佬专属福利
      5: [888, '888', 3],
      17: [8888, '8888', 3],
      23: [12345, '12345', 3],
      28: [23333, '23333', 3],
    } as Record<number, [number, string, number]>,
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
