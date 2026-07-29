import request from '@/utils/request'

export function getWalletBalances(data) {
  return request({
    url: '/admin/wallet/balance',
    method: 'post',
    headers: { repeatSubmit: false },
    data: data
  })
}

export function listWalletLedger(data) {
  return request({
    url: '/admin/wallet/ledger/page',
    method: 'post',
    data: data
  })
}

export function listRoomFeeLedger(data) {
  return request({
    url: '/admin/wallet/room-fee/page',
    method: 'post',
    data: data
  })
}

export function adjustWallet(data) {
  return request({
    url: '/admin/wallet/adjust',
    method: 'post',
    data: data
  })
}
