import { useLog } from '../util/log.js'

/**
 * 奖励设置
 */
export interface DnfReward {
  cash?: number, // 点卷数
  cashDisplay?: string, // 用于覆盖点卷数的显示字符串
  gold?: number, // 金币数
  items?: Array<{ // 物品清单
    id: number, // 物品 ID
    count: number, // 物品数量
  }>,
}

/**
 * 累签奖励设置
 */
export interface SignInReward {
  dailyReward: DnfReward, // 签到奖励
  minTrustLevel: number, // 需要的信任等级
}

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
  dnfMailSender: 'LinuxDo', // DNF 中邮件发送人的名字
  // 注册送多少点卷 (注册时无角色，只能发点卷)
  registerCash: 8888,
  // 签到奖励设置
  signInReward: {
    // 每日签到的奖励
    dailyReward: {
      cash: 1234,
      gold: 100000,
      items: [
        { id: 36,       count: 66 }, // 喇叭 x66
        { id: 666666,   count: 1 },  // 深渊派对通行证 x1
        { id: 3326,     count: 10 }, // 强烈的气息 x10
        { id: 8292,     count: 1 },  // 1% +12 装备强化券 x1
        { id: 8308,     count: 1 },  // 1% +12 装备增幅券 x1
        { id: 2600029,  count: 5 },  // 阿拉德初阶格斗家 x5
        { id: 2600261,  count: 3 },  // 28号 x3
        { id: 88888892, count: 2 },  // 点卷随机礼盒 x2
      ],
    } as DnfReward,
    // 每月签到满多少天的额外奖励
    cumulativeReward: {
      2: {
        dailyReward: {
          cash: 2024,
          items: [
            { id: 3326, count: 20 }, // 强烈的气息 x20
            { id: 8292, count: 5 },  // 1% +12 装备强化券 x5
            { id: 8308, count: 3 },  // 1% +12 装备增幅券 x3
          ],
        },
        minTrustLevel: 1,
      },
      3: { // 3 天 - 117 点卷 - 200000 金币 - 1% +12 装备强化券 x2 - 1% +12 装备增幅券 x1
        dailyReward: {
          cash: 117, cashDisplay: '0117',
          gold: 200000,
          items: [
            { id: 36,     count: 100 }, // 喇叭 x100
            { id: 666666, count: 3 },   // 深渊派对通行证 x3
            { id: 3326,   count: 30 },  // 强烈的气息 x30
            { id: 8305,   count: 3 },   // 90% +7 装备强化卷 x3
            { id: 8321,   count: 2 },   // 90% +7 装备增幅卷 x2
            { id: 88888892, count: 3 },  // 点卷随机礼盒 x3
          ],
        },
        minTrustLevel: 1,
      },
      6: {
        dailyReward: {
          cash: 5000,
          items: [
            { id: 666666, count: 5 },   // 深渊派对通行证 x5
            { id: 3326,   count: 50 },  // 强烈的气息 x50
            { id: 8300,   count: 2 },   // 30% +10 装备强化卷 x2
            { id: 8316,   count: 1 },   // 30% +10 装备增幅卷 x1
            { id: 88888892, count: 5 },  // 点卷随机礼盒 x5
          ],
        },
        minTrustLevel: 1,
      },
      9: { // 三级专享
        dailyReward: {
          cash: 6666,
          gold: 500000,
          items: [
            { id: 36,     count: 100 }, // 喇叭 x100
            { id: 666666, count: 20 },  // 深渊派对通行证 x20
            { id: 3326,   count: 80 },  // 强烈的气息 x80
            { id: 8301,   count: 1 },   // 30% +12 装备强化卷 x1
            { id: 8317,   count: 1 },   // 30% +12 装备增幅卷 x1
            { id: 88888892, count: 7 },  // 点卷随机礼盒 x7
          ],
        },
        minTrustLevel: 3,
      },
      12: {
        dailyReward: {
          cash: 6666,
          gold: 500000,
        },
        items: [
          { id: 36,     count: 200 }, // 喇叭 x200
          { id: 666666, count: 10 },  // 深渊派对通行证 x10
          { id: 3326,   count: 80 },  // 强烈的气息 x80
          { id: 8298,   count: 2 },   // 10% +12 装备强化卷 x2
          { id: 8314,   count: 1 },   // 10% +12 装备增幅卷 x1
          { id: 88888892, count: 9 },  // 点卷随机礼盒 x9
        ],
        minTrustLevel: 1,
      },
      15: { // 三级专享
        dailyReward: {
          cash: 8888,
        },
        items: [
          { id: 36,     count: 200 },  // 喇叭 x200
          { id: 666666, count: 30 },   // 深渊派对通行证 x30
          { id: 3326,   count: 100 },  // 强烈的气息 x100
          { id: 8301,   count: 2 },    // 30% +12 装备强化卷 x2
          { id: 8317,   count: 2 },    // 30% +12 装备增幅卷 x2
          { id: 88888892, count: 11 },  // 点卷随机礼盒 x11
        ],
        minTrustLevel: 3,
      },
      18: {
        dailyReward: {
          cash: 8888,
          items: [
            { id: 666666, count: 15 },   // 深渊派对通行证 x15
            { id: 3326,   count: 100 },  // 强烈的气息 x100
            { id: 8301,   count: 1 },    // 30% +12 装备强化卷 x1
            { id: 8317,   count: 1 },    // 30% +12 装备增幅卷 x1
            { id: 88888892, count: 13 },  // 点卷随机礼盒 x13
          ],
        },
        minTrustLevel: 1,
      },
      21: { // 三级专享
        dailyReward: {
          cash: 8888,
          gold: 888888,
          items: [
            { id: 36,     count: 300 },  // 喇叭 x300
            { id: 666666, count: 40 },   // 深渊派对通行证 x40
            { id: 3326,   count: 150 },  // 强烈的气息 x150
            { id: 8304,   count: 1 },    // 50% +12 装备强化卷 x1
            { id: 8320,   count: 1 },    // 50% +12 装备增幅卷 x1
            { id: 88888892, count: 15 },  // 点卷随机礼盒 x15
          ],
        },
        minTrustLevel: 3,
      },
      24: {
        dailyReward: {
          cash: 8888,
          gold: 888888,
          items: [
            { id: 36,     count: 300 },  // 喇叭 x300
            { id: 666666, count: 20 },   // 深渊派对通行证 x20
            { id: 3326,   count: 150 },  // 强烈的气息 x150
            { id: 8304,   count: 1 },    // 50% +12 装备强化卷 x1
            { id: 8320,   count: 1 },    // 50% +12 装备增幅卷 x1
            { id: 88888892, count: 17 },  // 点卷随机礼盒 x17
          ],
        },
        minTrustLevel: 1,
      },
      27: { // 三级专享
        dailyReward: {
          cash: 12345,
          items: [
            { id: 36,     count: 500 },  // 喇叭 x500
            { id: 666666, count: 50 },   // 深渊派对通行证 x50
            { id: 3326,   count: 300 },  // 强烈的气息 x300
            { id: 7275,   count: 1 },    // +12 装备强化卷 x1
            { id: 8237,   count: 1 },    // +12 装备增幅卷 x1
            { id: 88888892, count: 19 },  // 点卷随机礼盒 x19
          ],
        },
        minTrustLevel: 3,
      },
      28: {
        dailyReward: {
          cash: 12345,
          items: [
            { id: 666666, count: 30 },   // 深渊派对通行证 x30
            { id: 3326,   count: 200 },  // 强烈的气息 x200
            { id: 8307,   count: 2 },    // 90% +12 装备强化卷 x2
            { id: 8323,   count: 2 },    // 90% +12 装备增幅卷 x2
          ],
        },
        minTrustLevel: 1,
      },
    } as Record<number, SignInReward>,
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
