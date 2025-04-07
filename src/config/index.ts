import { useLog } from '../util/log.js'

/**
 * 奖励设置
 */
export interface DnfReward {
  cash?: number, // 点卷数
  cashDisplay?: string, // 用于覆盖点卷数的显示字符串
  gold?: number, // 金币数
  point?: number, // 积分数
  items?: Record<number, number> // 物品清单 <物品 ID, 物品数量>
}

/**
 * 累签奖励设置
 */
export interface SignInReward {
  reward: DnfReward, // 签到奖励
  minTrustLevel: number, // 需要的信任等级
}

export interface BanUser {
  linuxDoUid: number, // LinuxDo 用户 ID
  linuxDoName: string, // LinuxDo 用户名
  dofUid: number, // DOF 用户 ID
  reason: string, // 封禁原因
  endTime: Date, // 解封时间
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

  // 封号信息列表
  banList: [
  ] as Array<BanUser>,

  // 功能配置
  features: {
    // 自动拉无公会的玩家进公会
    autoJoinGuild: {
      enabled: true,
      guildId: 1, // 自动加入的公会 ID
    },
    // 欧皇创造计划
    luckyPlayer: { enabled: true },
    // 每天自动重启 Docker 容器
    autoRestartDocker: {
      enabled: true,
      cmd: 'docker restart dnf', // 重启命令
    },
    // 复活币自由计划
    freeCoin: {
      enabled: true,
      coinCount: 100, // 复活币数量
    },
    // 自动 1 段
    auto1st: {
      enabled: true,
    },
  },

  // DNF 中邮件发送人的名字
  dnfMailSender: 'LinuxDo',
  // 注册送多少点卷 (注册时无角色，只能发点卷)
  registerCash: 8888,
  // 签到奖励设置
  signInReward: {
    // 每日签到的奖励
    dailyReward: {
      cash: 1234,
      point: 100,
      items: {
        36: 66, // 喇叭 x66
        666666: 20, // 深渊派对通行证 x20
        3326: 10, // 强烈的气息 x10
        8292: 1, // 1% +12 装备强化券 x1
        8308: 1, // 1% +12 装备增幅券 x1
        88888892: 2, // 点卷随机礼盒 x2
      },
    } as DnfReward,
    // 每月签到满多少天的额外奖励
    monthReward: {
      2: {
        reward: {
          cash: 2024,
          point: 66,
          items: {
            3326: 20, // 强烈的气息 x20
            8292: 5, // 1% +12 装备强化券 x5
            8308: 3, // 1% +12 装备增幅券 x3
          },
        },
        minTrustLevel: 2,
      },
      3: {
        reward: {
          cash: 117, cashDisplay: '0117',
          point: 66,
          items: {
            36: 100, // 喇叭 x100
            666666: 50, // 深渊派对通行证 x50
            3326: 30, // 强烈的气息 x30
            8305: 3, // 90% +7 装备强化卷 x3
            8321: 2, // 90% +7 装备增幅卷 x2
            88888892: 3, // 点卷随机礼盒 x3
          },
        },
        minTrustLevel: 2,
      },
      6: {
        reward: {
          cash: 5000,
          point: 166,
          items: {
            666666: 60, // 深渊派对通行证 x60
            3326: 50, // 强烈的气息 x50
            8300: 2, // 30% +10 装备强化卷 x2
            8316: 1, // 30% +10 装备增幅卷 x1
            88888892: 5, // 点卷随机礼盒 x5
          },
        },
        minTrustLevel: 2,
      },
      9: { // 三级专享
        reward: {
          cash: 6666,
          point: 266,
          items: {
            36: 100, // 喇叭 x100
            666666: 70, // 深渊派对通行证 x70
            3326: 80, // 强烈的气息 x80
            8301: 1, // 30% +12 装备强化卷 x1
            8317: 1, // 30% +12 装备增幅卷 x1
            88888892: 7, // 点卷随机礼盒 x7
          },
        },
        minTrustLevel: 3,
      },
      12: {
        reward: {
          cash: 6666,
          point: 366,
          items: {
            36: 200, // 喇叭 x200
            666666: 60, // 深渊派对通行证 x60
            3326: 80, // 强烈的气息 x80
            8298: 2, // 10% +12 装备强化卷 x2
            8314: 1, // 10% +12 装备增幅卷 x1
            88888892: 9, // 点卷随机礼盒 x9
          },
        },
        minTrustLevel: 2,
      },
      15: { // 三级专享
        reward: {
          cash: 8888,
          point: 466,
          items: {
            36: 200, // 喇叭 x200
            666666: 80, // 深渊派对通行证 x80
            3326: 100, // 强烈的气息 x100
            8301: 2, // 30% +12 装备强化卷 x2
            8317: 2, // 30% +12 装备增幅卷 x2
            88888892: 11, // 点卷随机礼盒 x11
          },
        },
        minTrustLevel: 3,
      },
      18: {
        reward: {
          cash: 8888,
          point: 566,
          items: {
            666666: 80, // 深渊派对通行证 x80
            3326: 100, // 强烈的气息 x100
            8301: 1, // 30% +12 装备强化卷 x1
            8317: 1, // 30% +12 装备增幅卷 x1
            88888892: 13, // 点卷随机礼盒 x13
          },
        },
        minTrustLevel: 2,
      },
      21: { // 三级专享
        reward: {
          cash: 8888,
          point: 666,
          items: {
            36: 300, // 喇叭 x300
            666666: 90, // 深渊派对通行证 x90
            3326: 150, // 强烈的气息 x150
            8304: 1, // 50% +12 装备强化卷 x1
            8320: 1, // 50% +12 装备增幅卷 x1
            88888892: 15, // 点卷随机礼盒 x15
          },
        },
        minTrustLevel: 3,
      },
      24: {
        reward: {
          cash: 8888,
          point: 766,
          items: {
            36: 300, // 喇叭 x300
            666666: 70, // 深渊派对通行证 x70
            3326: 150, // 强烈的气息 x150
            8304: 1, // 50% +12 装备强化卷 x1
            8320: 1, // 50% +12 装备增幅卷 x1
            88888892: 17, // 点卷随机礼盒 x17
          },
        },
        minTrustLevel: 2,
      },
      27: { // 三级专享
        reward: {
          cash: 12345,
          point: 888,
          items: {
            36: 500, // 喇叭 x500
            666666: 100, // 深渊派对通行证 x100
            3326: 300, // 强烈的气息 x300
            7275: 1, // +12 装备强化卷 x1
            8237: 1, // +12 装备增幅卷 x1
            88888892: 19, // 点卷随机礼盒 x19
          },
        },
        minTrustLevel: 3,
      },
      28: {
        reward: {
          cash: 12345,
          point: 996,
          items: {
            666666: 100, // 深渊派对通行证 x100
            3326: 200, // 强烈的气息 x200
            8307: 2, // 90% +12 装备强化卷 x2
            8323: 2, // 90% +12 装备增幅卷 x2
          },
        },
        minTrustLevel: 2,
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
