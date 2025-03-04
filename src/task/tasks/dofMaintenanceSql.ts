import { useKnex } from "../../db/knex.js"

/**
 * DOF 日常维护 SQL
 */
export const dofMaintenanceSql = async () => {
  // 清理封号信息
  await useKnex().raw(`DELETE FROM d_taiwan.member_punish_info`)
  // 自动加入公会
  await useKnex().raw(`UPDATE taiwan_cain.charac_info SET guild_id = 1 WHERE guild_id = 0`)
  await useKnex().raw(`
    INSERT INTO d_guild.guild_member (guild_id, m_id, server_id, charac_no, charac_name, memo, grade, job, grow_type, lev, age, born_year, sex, apply_time, member_time, member_flag, bbs_cnt, last_visit_time, secede_type, secede_time, member_point, member_point_prev, last_play_time, nick_name)
    SELECT
      1, taiwan_cain.charac_info.m_id, 3, taiwan_cain.charac_info.charac_no, taiwan_cain.charac_info.charac_name, '', 3, taiwan_cain.charac_info.job,
      taiwan_cain.charac_info.grow_type, taiwan_cain.charac_info.lev, 0, '00', '-', NOW(), NOW(), 1, 0, NOW(), 0, NOW(), 0, 0, NOW(), ''
    FROM taiwan_cain.charac_info
    WHERE (SELECT COUNT(*) FROM d_guild.guild_member WHERE d_guild.guild_member.charac_no = taiwan_cain.charac_info.charac_no) <= 0
  `)
}
