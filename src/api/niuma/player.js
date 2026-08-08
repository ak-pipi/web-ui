import request from '@/utils/request';
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询用户列表
export function listPlayer(data) {
  return request({
    url: '/admin/player/page',
    method: 'post',
    data: data
  });
}

// 禁用或启用玩家
export function banPlayer(playerId) {
  return request({
    url: '/admin/player/ban/' + parseStrEmpty(playerId),
    method: 'post'
  });
}

// 查询玩家聚合详情
export function getPlayerDetail(playerId) {
  return request({
    url: '/admin/player/detail/' + parseStrEmpty(playerId),
    method: 'get'
  });
}

// 查询玩家真实战绩汇总
export function getPlayerRecords(playerId) {
  return request({
    url: '/admin/player/' + parseStrEmpty(playerId) + '/records',
    method: 'get'
  });
}

// 查询玩家三天回放列表
export function listPlayerReplay(playerId, data) {
  return request({
    url: '/admin/player/' + parseStrEmpty(playerId) + '/replay/page',
    method: 'post',
    data: data
  });
}

// 查询玩家三天回放数据
export function getPlayerReplayPlayback(playerId, data) {
  return request({
    url: '/admin/player/' + parseStrEmpty(playerId) + '/replay/playback',
    method: 'post',
    data: data
  });
}
