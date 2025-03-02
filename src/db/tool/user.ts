import { User } from '@prisma/client'
import { LinuxDoUserInfoResp } from '../../api/api.js'
import { ResultObj, useResult } from '../../util/result.js'
import { usePrisma } from '../index.js'

/**
 * 用户表附加工具
 */
class UserTool {
  /**
   * 基于 ID 查询用户
   * @param id 用户 ID
   * @returns 用户
   */
  async findById(id: number) {
    return await usePrisma().user.findUnique({ where: { id }})
  }

  /**
   * 通过 LinuxDo 用户 ID 查询用户
   * @param id LinuxDo 用户 ID
   */
  async findByLinuxDoUid(id: number) {
    return await usePrisma().user.findUnique({ where: { linuxDoUid: id } })
  }

  /**
   * LinuxDo 登录获取用户信息
   * @param linuxDoUid LinuxDo 用户 ID
   */
  async linuxDoGetOrRegister(linuxDoUserInfo: LinuxDoUserInfoResp): Promise<ResultObj<User>> {
    // 查询用户信息
    const user = await this.findByLinuxDoUid(linuxDoUserInfo.id)

    const now = new Date()

    // 若用户未注册，则为其注册
    if (!user) {
      if (linuxDoUserInfo.silenced) { // 用户被禁言，禁止注册
        return useResult().fail('您当前已被 LinuxDo 禁言，暂时无法注册账号')
      }
      if (linuxDoUserInfo.trust_level < 2) { // 用户信任等级不足，禁止注册，以避免太容易的注册小号
        return useResult().fail('您需要在 LinuxDo 升级到 2 级才能注册，请先多摸摸鱼喵，升级引导：https://linux.do/t/topic/2460')
      }

      await usePrisma().user.create({
        data: {
          addtime: now,

          linuxDoUid: linuxDoUserInfo.id,
          linuxDoUsername: linuxDoUserInfo.username,
          linuxDoName: linuxDoUserInfo.name,
          linuxDoTrustLevel: linuxDoUserInfo.trust_level,
          linuxDoSilenced: linuxDoUserInfo.silenced,
          linuxDoInfoUpdatTime: now,
        },
      })
    } else {
      // 用户已注册，更新用户信息
      await usePrisma().user.update({
        where: { id: user.id },
        data: {
          linuxDoUsername: linuxDoUserInfo.username,
          linuxDoName: linuxDoUserInfo.name,
          linuxDoTrustLevel: linuxDoUserInfo.trust_level,
          linuxDoSilenced: linuxDoUserInfo.silenced,
          linuxDoInfoUpdatTime: now,
        },
      })
    }

    // 返回用户信息
    return useResult().success(user)
  }
}

const instance = new UserTool()
export function useUserTool() {
  return instance
}
