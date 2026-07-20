import request from '@/utils/request'
import { parseStrEmpty } from '@/utils/ruoyi'

export function getAgencyOverview() {
  return request({
    url: '/admin/agency/overview',
    method: 'get'
  })
}

export function getAgencyTree() {
  return request({
    url: '/admin/agency/tree',
    method: 'get'
  })
}

export function listAgency(data) {
  return request({
    url: '/admin/agency/page',
    method: 'post',
    data: data
  })
}

export function createAgency(data) {
  return request({
    url: '/admin/agency/create',
    method: 'post',
    data: data
  })
}

export function updateAgencyRate(agentPlayerId, data) {
  return request({
    url: '/admin/agency/' + parseStrEmpty(agentPlayerId) + '/rate',
    method: 'put',
    data: data
  })
}

export function updateAgencyStatus(agentPlayerId, data) {
  return request({
    url: '/admin/agency/' + parseStrEmpty(agentPlayerId) + '/status',
    method: 'put',
    data: data
  })
}

export function resetAgencyInviteCode(agentPlayerId) {
  return request({
    url: '/admin/agency/' + parseStrEmpty(agentPlayerId) + '/invite-code',
    method: 'post'
  })
}

export function listAgencyInviteCode(data) {
  return request({
    url: '/admin/agency/invite/page',
    method: 'post',
    data: data
  })
}

export function bindPlayerByInviteCode(data) {
  return request({
    url: '/admin/agency/bind/by-code',
    method: 'post',
    data: data
  })
}

export function listAgencyBinding(data) {
  return request({
    url: '/admin/agency/bindings/page',
    method: 'post',
    data: data
  })
}

export function listAgencyCommission(data) {
  return request({
    url: '/admin/agency/commission/page',
    method: 'post',
    data: data
  })
}

export function getAgencyCommissionSummary(data) {
  return request({
    url: '/admin/agency/commission/summary',
    method: 'post',
    data: data
  })
}

export function listAgencyWalletLedger(data) {
  return request({
    url: '/admin/agency/wallet/ledger/page',
    method: 'post',
    data: data
  })
}

export function adjustAgencyWallet(data) {
  return request({
    url: '/admin/agency/wallet/adjust',
    method: 'post',
    data: data
  })
}

export function listAgencyUnbindRequest(data) {
  return request({
    url: '/admin/agency/unbind/page',
    method: 'post',
    data: data
  })
}

export function requestAgencyUnbind(data) {
  return request({
    url: '/admin/agency/unbind/request',
    method: 'post',
    data: data
  })
}

export function approveAgencyUnbind(requestId, data) {
  return request({
    url: '/admin/agency/unbind/' + parseStrEmpty(requestId) + '/approve',
    method: 'post',
    data: data
  })
}

export function executeAgencyUnbind(requestId) {
  return request({
    url: '/admin/agency/unbind/' + parseStrEmpty(requestId) + '/execute',
    method: 'post'
  })
}

export function getAgencyPlayerStats(playerId) {
  return request({
    url: '/admin/agency/stats/player/' + parseStrEmpty(playerId),
    method: 'get'
  })
}
