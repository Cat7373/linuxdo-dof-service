import dayjs from "dayjs"
import config, { DnfReward } from "../config/index.js"
import { useKnex } from "../db/knex.js"
import { Buffer } from 'buffer'
import iconv from 'iconv-lite'

/**
 * 等待一会
 * @param {Number} duration 等待的时间(毫秒)
 */
export function sleep(duration: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, duration))
}

/**
 * 发放签到奖励 (注意，无事务保护，请外部自行处理)
 * @param dnfId DNF 账号 ID
 * @param characId 角色 ID (未绑定传空，则这块奖励不发放)
 * @param reward 奖励内容
 */
export async function sendReward(dnfId: number, characId: number | null, reward: DnfReward) {
  // 发放点卷
  if (reward.cash) {
    await useKnex().raw(`UPDATE taiwan_billing.cash_cera_point SET cera_point = cera_point + ${reward.cash} WHERE account = ${dnfId}`)
  }

  // 发放金币 (附件带一个无色小晶体)
  if (reward.gold && characId) {
    await useKnex().raw(`INSERT INTO taiwan_cain_2nd.postal (occ_time, send_charac_name, receive_charac_no, item_id, add_info, gold) VALUES ('${dayjs().format('YYYY-MM-DD HH:mm:ss')}', '${config.dnfMailSender}', ${characId}, 3037, 1, ${reward.gold})`)
  }

  // 发放物品
  if (reward.items) {
    for (const item of reward.items) {
      const endTime = Math.ceil((Date.now() - 1151683200000) / 86400000) + 30
      await useKnex().raw(`INSERT INTO taiwan_cain_2nd.postal (occ_time, send_charac_name, receive_charac_no, item_id, add_info, endurance) VALUES ('${dayjs().format('YYYY-MM-DD HH:mm:ss')}', '${config.dnfMailSender}', ${characId}, ${item.id}, ${item.count}, ${endTime})`)
    }
  }
}

/**
 * 转换 DNF 数据库中的字符串
 * @param hex 字符串的 Hex 表示
 * @returns 转换后的字符串
 */
export function convertDnfString(hex: string) {
  if (!hex) return ''

  const bytes = Buffer.from(hex, 'hex')
  let str = bytes.toString('utf-8')

  let buffer = Buffer.alloc(str.length)
  for (let i = 0; i < str.length; ++i) {
    let c = str.charCodeAt(i)
    if (c === 0x81) {
      buffer[i] = 0x81
    } else if (c === 0x8d) {
      buffer[i] = 0x8d
    } else if (c === 0x8f) {
      buffer[i] = 0x8f
    } else if (c === 0x90) {
      buffer[i] = 0x90
    } else if (c === 0x9d) {
      buffer[i] = 0x9d
    } else {
      buffer[i] = iconv.encode(String.fromCharCode(c), 'cp1252')[0]!
    }
  }
  return buffer.toString('utf-8')
}
