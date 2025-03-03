import { useKnex } from "../../db/knex.js"

/**
 * 清理 DOF 的封号信息表
 */
export const clearHackInfo = async () => {
  await useKnex().raw(`DELETE FROM d_taiwan.member_punish_info`)
}
