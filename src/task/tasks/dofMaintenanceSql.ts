import config from "../../config/index.js"
import { useKnex } from "../../db/knex.js"

/**
 * DOF 日常维护 SQL (10秒)
 */
export const dofMaintenanceSql10s = async () => {
  // 创建封号信息 (因为不知道为什么会自动清理，每分钟干它一次，如果后面感觉不行，改成 3s 也不是不可以)
  for (const banUser of config.banList) {
    await useKnex().raw(`
      INSERT IGNORE INTO d_taiwan.member_punish_info
        (m_id, punish_type, occ_time, punish_value, apply_flag, start_time, end_time, admin_id, reason)
      VALUES
        (${banUser.dofUid}, 1, '2015-10-31 00:00:00', 101, 2, '2015-10-31 00:00:00', '9999-12-31 23:59:59', 'Cat73', 'GM')
    `)
  }
}

/**
 * DOF 日常维护 SQL (1分钟)
 */
export const dofMaintenanceSql1m = async () => {
  // 清理封号信息
  await useKnex().raw(`DELETE FROM d_taiwan.member_punish_info WHERE admin_id = 'GM'`)
}

/**
 * DOF 日常维护 SQL (10分钟)
 */
export const dofMaintenanceSql10m = async () => {
  // 自动加入公会
  // 更新角色公会信息
  await useKnex().raw(`UPDATE taiwan_cain.charac_info SET guild_id = 1, guild_right = 1 WHERE guild_id = 0`)
  // 添加公会角色记录
  await useKnex().raw(`
    INSERT INTO d_guild.guild_member (guild_id, m_id, server_id, charac_no, charac_name, memo, grade, job, grow_type, lev, age, born_year, sex, apply_time, member_time, member_flag, bbs_cnt, last_visit_time, secede_type, secede_time, member_point, member_point_prev, last_play_time, nick_name)
    SELECT
      1, taiwan_cain.charac_info.m_id, 3, taiwan_cain.charac_info.charac_no, taiwan_cain.charac_info.charac_name, '', 3, taiwan_cain.charac_info.job,
      taiwan_cain.charac_info.grow_type, taiwan_cain.charac_info.lev, 0, '00', '-', NOW(), NOW(), 1, 0, NOW(), 0, NOW(), 0, 0, NOW(), ''
    FROM taiwan_cain.charac_info
    WHERE (SELECT COUNT(*) FROM d_guild.guild_member WHERE d_guild.guild_member.charac_no = taiwan_cain.charac_info.charac_no) <= 0
  `)
  // 更新公会成员为优秀级
  await useKnex().raw(`UPDATE d_guild.guild_member SET grade = 3 WHERE guild_id = 1 AND grade IN (0, 4)`)
  // 更新公会会员数
  await useKnex().raw(`
    UPDATE d_guild.guild_info
    SET member_count = (SELECT COUNT(*) FROM d_guild.guild_member WHERE d_guild.guild_member.guild_id = 1)
    WHERE guild_id = 1
  `)
  // 删除公会申请记录
  await useKnex().raw(`DELETE FROM d_guild.guild_join_list WHERE guild_id = 1`)
}
