import { useKnex } from "../../db/knex.js"

/**
 * DOF 日常维护 SQL
 */
export const dofMaintenanceSql = async () => {
  // 清理封号信息
  await useKnex().raw(`DELETE FROM d_taiwan.member_punish_info`)
  // 自动加入公会
  await useKnex().raw(`UPDATE taiwan_cain.charac_info SET guild_id = 1 WHERE guild_id = 0`)
}
