<template>
  <div class="app-container">
    <el-form
      ref="queryForm"
      :model="queryParams"
      size="small"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="ID" prop="playerId">
        <el-input
          v-model="queryParams.playerId"
          placeholder="请输入ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入昵称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="在线状态" prop="online">
        <el-select v-model="queryParams.online" placeholder="请选择" clearable>
          <el-option label="在线" :value="1" />
          <el-option label="离线" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="playerList">
      <el-table-column label="ID" align="center" prop="playerId" min-width="120" />
      <el-table-column label="账号" align="center" prop="account" min-width="120" />
      <el-table-column label="昵称" align="center" prop="nickname" min-width="120" />
      <el-table-column label="头像" align="center" prop="headUrl" width="80">
        <template slot-scope="scope">
          <el-avatar :size="42" :src="scope.row.headUrl" />
        </template>
      </el-table-column>
      <el-table-column label="电话" align="center" prop="phone" min-width="120" />
      <el-table-column label="性别" align="center" width="80">
        <template slot-scope="scope">
          <span>{{ getSex(scope.row.sex) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前积分" align="right" prop="goldBalance" min-width="110">
        <template slot-scope="scope">
          <span>{{ amountText(scope.row.goldBalance) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上级代理" align="center" prop="agency" min-width="160" />
      <el-table-column label="当前游戏" align="center" prop="gameRoom" min-width="150" />
      <el-table-column label="登录IP" align="center" prop="loginIp" min-width="130" />
      <el-table-column label="登录时间" align="center" prop="loginDate" min-width="160" />
      <el-table-column label="在线" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.online === 1 ? 'success' : 'info'" size="mini">
            {{ scope.row.online === 1 ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="禁用" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.banned === 1 ? 'danger' : 'success'" size="mini">
            {{ scope.row.banned === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="320" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            @click="handleDetail(scope.row)"
            v-hasPermi="['niuma:player']"
          >详情</el-button>
          <el-button
            size="mini"
            type="text"
            @click="handleBan(scope.row)"
            v-hasPermi="['niuma:player']"
          >{{ scope.row.banned === 1 ? '启用' : '禁用' }}</el-button>
          <el-button
            size="mini"
            type="text"
            @click="handleLedger(scope.row)"
            v-hasPermi="['niuma:wallet:ledger']"
          >流水</el-button>
          <el-button
            size="mini"
            type="text"
            @click="handleRoomFee(scope.row)"
            v-hasPermi="['niuma:wallet:roomFee']"
          >房费</el-button>
          <el-button
            size="mini"
            type="text"
            @click="handleAdjust(scope.row)"
            v-hasPermi="['niuma:wallet:adjust']"
          >积分调整</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog
      :title="'玩家详情 - ' + detailQuery.playerId"
      :visible.sync="detailOpen"
      width="1060px"
      append-to-body
    >
      <div v-loading="detailLoading">
        <el-descriptions v-if="playerDetail" :column="3" border size="small">
          <el-descriptions-item label="玩家ID">{{ playerDetail.playerId }}</el-descriptions-item>
          <el-descriptions-item label="账号">{{ playerDetail.account || '-' }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ playerDetail.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ playerStatusText(playerDetail.status) }}</el-descriptions-item>
          <el-descriptions-item label="当前积分">{{ amountText(playerDetail.goldBalance) }}</el-descriptions-item>
          <el-descriptions-item label="保险箱">{{ amountText(playerDetail.depositBalance) }}</el-descriptions-item>
          <el-descriptions-item label="总场次">{{ amountText(playerDetail.totalRounds) }}</el-descriptions-item>
          <el-descriptions-item label="胜率">{{ percentText(playerDetail.winRate) }}</el-descriptions-item>
          <el-descriptions-item label="净输赢">{{ signedAmountText(playerDetail.totalScoreDelta) }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">玩法汇总</el-divider>
        <el-table :data="gameSummaryList" size="small">
          <el-table-column label="玩法" align="center" prop="gameName" min-width="110" />
          <el-table-column label="总场次" align="right" prop="totalRounds" min-width="90" />
          <el-table-column label="胜场" align="right" prop="winCount" min-width="80" />
          <el-table-column label="负场" align="right" prop="loseCount" min-width="80" />
          <el-table-column label="今日场次" align="right" prop="todayRounds" min-width="90" />
          <el-table-column label="胜率" align="right" min-width="90">
            <template slot-scope="scope">
              <span>{{ percentText(scope.row.winRate) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="净输赢" align="right" min-width="100">
            <template slot-scope="scope">
              <span :class="amountClass(scope.row.totalScoreDelta)">{{ signedAmountText(scope.row.totalScoreDelta) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="最近对局" align="center" prop="latestTime" min-width="160" />
        </el-table>

        <el-divider content-position="left">三天回放</el-divider>
        <el-form :model="detailReplayQuery" size="small" :inline="true" label-width="68px">
          <el-form-item label="玩法">
            <el-select v-model="detailReplayQuery.gameType" placeholder="请选择玩法" style="width: 150px">
              <el-option
                v-for="item in replayGameOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="queryDetailReplay">搜索</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="detailReplayLoading" :data="detailReplayList" size="small">
          <el-table-column label="记录ID" align="center" prop="id" width="90" />
          <el-table-column label="玩法" align="center" prop="gameName" min-width="100" />
          <el-table-column label="房号" align="center" prop="number" min-width="100" />
          <el-table-column label="局号" align="center" prop="roundNo" width="80" />
          <el-table-column label="玩家" align="center" min-width="220">
            <template slot-scope="scope">
              <span>{{ replayPlayersText(scope.row.players) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="输赢积分" align="center" min-width="150">
            <template slot-scope="scope">
              <span>{{ replayArrayText(scope.row.winGolds) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时间" align="center" prop="time" min-width="150" />
          <el-table-column label="追溯窗口" align="center" min-width="250">
            <template slot-scope="scope">
              <span>{{ replayTraceText(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="90">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="mini"
                :disabled="!scope.row.hasReplay"
                @click="openPlayerReplayPlayback(scope.row)"
              >查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="detailReplayTotal > 0"
          :total="detailReplayTotal"
          :page.sync="detailReplayQuery.pageNum"
          :limit.sync="detailReplayQuery.pageSize"
          @pagination="loadDetailReplayList"
        />
      </div>
    </el-dialog>

    <el-dialog
      title="对局回放"
      :visible.sync="replayPlaybackOpen"
      width="760px"
      append-to-body
    >
      <el-descriptions v-if="replayPlayback" :column="2" border size="small">
        <el-descriptions-item label="玩法">{{ replayPlayback.gameName }}</el-descriptions-item>
        <el-descriptions-item label="房号">{{ replayPlayback.number }}</el-descriptions-item>
        <el-descriptions-item label="局号">{{ replayPlayback.roundNo }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ replayPlayback.time }}</el-descriptions-item>
        <el-descriptions-item label="追溯窗口" :span="2">{{ replayTraceText(replayPlayback) }}</el-descriptions-item>
        <el-descriptions-item label="玩家" :span="2">{{ replayPlayersText(replayPlayback.players) }}</el-descriptions-item>
        <el-descriptions-item label="分数" :span="2">{{ replayArrayText(replayPlayback.scores) }}</el-descriptions-item>
        <el-descriptions-item label="输赢积分" :span="2">{{ replayArrayText(replayPlayback.winGolds) }}</el-descriptions-item>
      </el-descriptions>
      <el-input
        v-if="replayPlayback && replayPlayback.base64"
        v-model="replayPlayback.base64"
        type="textarea"
        :rows="8"
        readonly
        class="replay-base64"
      />
      <span v-else class="muted">回放数据不存在或已过期</span>
    </el-dialog>

    <el-dialog
      :title="'积分调整 - ' + adjustForm.playerId"
      :visible.sync="adjustOpen"
      width="520px"
      append-to-body
    >
      <el-form ref="adjustForm" :model="adjustForm" :rules="adjustRules" label-width="92px" size="small">
        <el-form-item label="玩家ID">
          <el-input v-model="adjustForm.playerId" disabled />
        </el-form-item>
        <el-form-item label="当前积分">
          <span class="amount-strong">{{ amountText(adjustForm.currentGold) }}</span>
          <el-button
            type="text"
            size="mini"
            :loading="adjustBalanceLoading"
            @click="loadAdjustBalance"
          >刷新</el-button>
        </el-form-item>
        <el-form-item label="钱包" prop="walletType">
          <el-select v-model="adjustForm.walletType" placeholder="请选择钱包" style="width: 100%">
            <el-option
              v-for="item in adjustWalletOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型" prop="action">
          <el-radio-group v-model="adjustForm.action">
            <el-radio-button label="increase">增加</el-radio-button>
            <el-radio-button label="decrease">减少</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量" prop="amount">
          <el-input-number
            v-model="adjustForm.amount"
            :min="1"
            :max="999999999"
            :step="1"
            :precision="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="adjustForm.reason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="adjustOpen = false">取 消</el-button>
        <el-button type="primary" :loading="adjustLoading" @click="submitAdjust">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="'积分流水 - ' + ledgerQuery.playerId"
      :visible.sync="ledgerOpen"
      width="980px"
      append-to-body
    >
      <el-form
        ref="ledgerQueryForm"
        :model="ledgerQuery"
        size="small"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="钱包" prop="walletType">
          <el-select v-model="ledgerQuery.walletType" clearable placeholder="全部" style="width: 130px">
            <el-option
              v-for="item in walletOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="业务" prop="bizType">
          <el-select v-model="ledgerQuery.bizType" clearable placeholder="全部" style="width: 150px">
            <el-option
              v-for="item in bizOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="ledgerRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="mini" @click="queryLedger">搜索</el-button>
          <el-button icon="el-icon-refresh" size="mini" @click="resetLedgerQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="ledgerLoading" :data="ledgerList">
        <el-table-column label="时间" align="center" prop="createTime" min-width="160" />
        <el-table-column label="钱包" align="center" min-width="90">
          <template slot-scope="scope">
            <span>{{ walletTypeText(scope.row.walletType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变动" align="right" min-width="100">
          <template slot-scope="scope">
            <span :class="amountClass(scope.row.changeAmount)">
              {{ signedAmountText(scope.row.changeAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额" align="right" min-width="110">
          <template slot-scope="scope">
            <span>{{ amountText(scope.row.balanceAfter) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="业务" align="center" min-width="120">
          <template slot-scope="scope">
            <span>{{ bizTypeText(scope.row.bizType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="参考号" align="center" prop="refNo" min-width="180" show-overflow-tooltip />
      </el-table>

      <pagination
        v-show="ledgerTotal > 0"
        :total="ledgerTotal"
        :page.sync="ledgerQuery.pageNum"
        :limit.sync="ledgerQuery.pageSize"
        @pagination="loadLedgerList"
      />
    </el-dialog>

    <el-dialog
      :title="'房费流水 - ' + roomFeeQuery.playerId"
      :visible.sync="roomFeeOpen"
      width="900px"
      append-to-body
    >
      <el-form ref="roomFeeQueryForm" :model="roomFeeQuery" size="small" :inline="true" label-width="68px">
        <el-form-item label="时间">
          <el-date-picker
            v-model="roomFeeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="mini" @click="queryRoomFee">搜索</el-button>
          <el-button icon="el-icon-refresh" size="mini" @click="resetRoomFeeQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="roomFeeLoading" :data="roomFeeList">
        <el-table-column label="时间" align="center" prop="createTime" min-width="160" />
        <el-table-column label="房间ID" align="center" prop="roomId" min-width="140" show-overflow-tooltip />
        <el-table-column label="扣费方式" align="center" min-width="100">
          <template slot-scope="scope">
            <span>{{ feeTypeText(scope.row.feeType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="钱包" align="center" min-width="100">
          <template slot-scope="scope">
            <span>{{ walletTypeText(scope.row.payWalletType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="房费" align="right" min-width="100">
          <template slot-scope="scope">
            <span>{{ amountText(scope.row.feeAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="220" show-overflow-tooltip />
      </el-table>

      <pagination
        v-show="roomFeeTotal > 0"
        :total="roomFeeTotal"
        :page.sync="roomFeeQuery.pageNum"
        :limit.sync="roomFeeQuery.pageSize"
        @pagination="loadRoomFeeList"
      />
    </el-dialog>
  </div>
</template>

<script>
import { listPlayer, banPlayer, getPlayerDetail, listPlayerReplay, getPlayerReplayPlayback } from '@/api/niuma/player'
import { adjustWallet, getWalletBalances, listRoomFeeLedger, listWalletLedger } from '@/api/niuma/wallet'

export default {
  name: 'Player',
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      playerList: [],
      queryParams: {
        playerId: null,
        nickname: null,
        online: null,
        pageNum: 1,
        pageSize: 10
      },
      walletOptions: [
        { label: '积分', value: 'gold' },
        { label: '房卡', value: 'room_card' },
        { label: '积分', value: 'points' }
      ],
      adjustWalletOptions: [
        { label: '积分', value: 'gold' }
      ],
      bizOptions: [
        { label: '牌局结算', value: 'game_settle' },
        { label: '扣房费', value: 'room_fee' },
        { label: '房间押金', value: 'room_deposit' },
        { label: '代理返佣', value: 'agency_commission' },
        { label: '后台调整', value: 'admin_adjust' },
        { label: '转账转入', value: 'transfer_in' },
        { label: '转账转出', value: 'transfer_out' },
        { label: '充值', value: 'recharge' },
        { label: '提现', value: 'withdraw' }
      ],
      adjustOpen: false,
      adjustLoading: false,
      adjustBalanceLoading: false,
      adjustForm: {
        playerId: null,
        currentGold: 0,
        walletType: 'gold',
        action: 'increase',
        amount: 1,
        reason: ''
      },
      adjustRules: {
        walletType: [{ required: true, message: '钱包不能为空', trigger: 'change' }],
        action: [{ required: true, message: '操作类型不能为空', trigger: 'change' }],
        amount: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '调整原因不能为空', trigger: 'blur' }]
      },
      ledgerOpen: false,
      ledgerLoading: false,
      ledgerList: [],
      ledgerTotal: 0,
      ledgerRange: [],
      ledgerQuery: {
        playerId: null,
        walletType: null,
        bizType: null,
        pageNum: 1,
        pageSize: 10
      },
      roomFeeOpen: false,
      roomFeeLoading: false,
      roomFeeList: [],
      roomFeeTotal: 0,
      roomFeeRange: [],
      roomFeeQuery: {
        playerId: null,
        pageNum: 1,
        pageSize: 10
      },
      detailOpen: false,
      detailLoading: false,
      playerDetail: null,
      gameSummaryList: [],
      detailQuery: {
        playerId: null
      },
      replayGameOptions: [
        { label: '桃江麻将', value: 1031 },
        { label: '红中麻将', value: 1032 },
        { label: '跑得快', value: 1033 },
        { label: '长沙麻将', value: 1034 }
      ],
      detailReplayLoading: false,
      detailReplayList: [],
      detailReplayTotal: 0,
      detailReplayQuery: {
        playerId: null,
        gameType: 1031,
        pageNum: 1,
        pageSize: 5
      },
      replayPlaybackOpen: false,
      replayPlayback: null
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listPlayer(this.queryParams).then(response => {
        this.playerList = response.records || []
        this.total = response.total || 0
      }).finally(() => {
        this.loading = false
      })
    },
    getSex(sex) {
      if (sex === 1) {
        return '男'
      }
      if (sex === 2) {
        return '女'
      }
      return '未知'
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleBan(row) {
      const text = row.banned === 1 ? '启用' : '禁用'
      this.$modal.confirm('确认要' + text + '玩家 ' + row.playerId + ' 吗？').then(() => {
        return banPlayer(row.playerId)
      }).then(() => {
        this.$modal.msgSuccess(text + '成功')
        this.getList()
      })
    },
    handleDetail(row) {
      this.detailQuery.playerId = row.playerId
      this.detailReplayQuery = {
        playerId: row.playerId,
        gameType: 1031,
        pageNum: 1,
        pageSize: 5
      }
      this.detailOpen = true
      this.loadPlayerDetail()
      this.loadDetailReplayList()
    },
    loadPlayerDetail() {
      if (!this.detailQuery.playerId) {
        return
      }
      this.detailLoading = true
      getPlayerDetail(this.detailQuery.playerId).then(response => {
        this.playerDetail = response.detail || null
        this.gameSummaryList = (this.playerDetail && this.playerDetail.gameSummaries) || []
      }).finally(() => {
        this.detailLoading = false
      })
    },
    queryDetailReplay() {
      this.detailReplayQuery.pageNum = 1
      this.loadDetailReplayList()
    },
    loadDetailReplayList() {
      if (!this.detailReplayQuery.playerId) {
        return
      }
      this.detailReplayLoading = true
      listPlayerReplay(this.detailReplayQuery.playerId, this.detailReplayQuery).then(response => {
        this.detailReplayList = response.records || []
        this.detailReplayTotal = response.total || 0
      }).finally(() => {
        this.detailReplayLoading = false
      })
    },
    openPlayerReplayPlayback(row) {
      getPlayerReplayPlayback(this.detailReplayQuery.playerId, {
        id: row.id,
        gameType: row.gameType
      }).then(response => {
        this.replayPlayback = response.data || null
        this.replayPlaybackOpen = true
      })
    },
    handleAdjust(row) {
      this.adjustForm = {
        playerId: row.playerId,
        currentGold: row.goldBalance || 0,
        walletType: 'gold',
        action: 'increase',
        amount: 1,
        reason: ''
      }
      this.adjustOpen = true
      this.$nextTick(() => {
        this.resetForm('adjustForm')
        this.loadAdjustBalance()
      })
    },
    loadAdjustBalance() {
      if (this.adjustBalanceLoading) {
        return
      }
      if (!this.adjustForm.playerId) {
        this.adjustForm.currentGold = 0
        return
      }
      this.adjustBalanceLoading = true
      getWalletBalances({ playerId: this.adjustForm.playerId }).then(response => {
        this.adjustForm.currentGold = response && response.gold != null ? response.gold : 0
      }).finally(() => {
        this.adjustBalanceLoading = false
      }).catch(() => {})
    },
    submitAdjust() {
      this.$refs.adjustForm.validate(valid => {
        if (!valid) {
          return
        }
        if (!this.adjustForm.amount || this.adjustForm.amount <= 0) {
          this.$modal.msgError('数量必须大于0')
          return
        }
        const payload = Object.assign({}, this.adjustForm, {
          amount: this.adjustForm.action === 'decrease'
            ? -Math.abs(this.adjustForm.amount)
            : Math.abs(this.adjustForm.amount)
        })
        this.adjustLoading = true
        adjustWallet(payload).then(() => {
          this.$modal.msgSuccess('积分调整成功')
          this.adjustOpen = false
          this.getList()
          if (this.ledgerOpen && this.ledgerQuery.playerId === this.adjustForm.playerId) {
            this.loadLedgerList()
          }
        }).finally(() => {
          this.adjustLoading = false
        }).catch(() => {})
      })
    },
    handleLedger(row) {
      this.ledgerQuery = {
        playerId: row.playerId,
        walletType: null,
        bizType: null,
        pageNum: 1,
        pageSize: 10
      }
      this.ledgerRange = []
      this.ledgerOpen = true
      this.loadLedgerList()
    },
    queryLedger() {
      this.ledgerQuery.pageNum = 1
      this.loadLedgerList()
    },
    resetLedgerQuery() {
      const playerId = this.ledgerQuery.playerId
      this.ledgerRange = []
      this.ledgerQuery = {
        playerId: playerId,
        walletType: null,
        bizType: null,
        pageNum: 1,
        pageSize: 10
      }
      this.loadLedgerList()
    },
    loadLedgerList() {
      this.ledgerLoading = true
      listWalletLedger(this.buildTimeQuery(this.ledgerQuery, this.ledgerRange)).then(response => {
        this.ledgerList = response.records || []
        this.ledgerTotal = response.total || 0
      }).finally(() => {
        this.ledgerLoading = false
      })
    },
    handleRoomFee(row) {
      this.roomFeeQuery = {
        playerId: row.playerId,
        pageNum: 1,
        pageSize: 10
      }
      this.roomFeeRange = []
      this.roomFeeOpen = true
      this.loadRoomFeeList()
    },
    queryRoomFee() {
      this.roomFeeQuery.pageNum = 1
      this.loadRoomFeeList()
    },
    resetRoomFeeQuery() {
      const playerId = this.roomFeeQuery.playerId
      this.roomFeeRange = []
      this.roomFeeQuery = {
        playerId: playerId,
        pageNum: 1,
        pageSize: 10
      }
      this.loadRoomFeeList()
    },
    loadRoomFeeList() {
      this.roomFeeLoading = true
      listRoomFeeLedger(this.buildTimeQuery(this.roomFeeQuery, this.roomFeeRange)).then(response => {
        this.roomFeeList = response.records || []
        this.roomFeeTotal = response.total || 0
      }).finally(() => {
        this.roomFeeLoading = false
      })
    },
    buildTimeQuery(query, range) {
      const data = Object.assign({}, query)
      if (range && range.length === 2) {
        data.startTime = range[0]
        data.endTime = range[1]
      }
      return data
    },
    amountText(value) {
      return Number(value || 0).toLocaleString()
    },
    signedAmountText(value) {
      const amount = Number(value || 0)
      return (amount > 0 ? '+' : '') + amount.toLocaleString()
    },
    amountClass(value) {
      const amount = Number(value || 0)
      if (amount > 0) {
        return 'amount-positive'
      }
      if (amount < 0) {
        return 'amount-negative'
      }
      return ''
    },
    percentText(value) {
      const num = Number(value || 0)
      return num.toFixed(1) + '%'
    },
    playerStatusText(value) {
      const map = {
        online: '在线',
        offline: '离线',
        banned: '已禁用',
        frozen: '已冻结',
        normal: '正常'
      }
      return map[value] || value || '-'
    },
    replayPlayersText(players) {
      if (!players || !players.length) {
        return '-'
      }
      return players
        .filter(Boolean)
        .map(item => (item.nickname || item.playerId || '-') + '(' + (item.playerId || '-') + ')')
        .join(' / ')
    },
    replayArrayText(values) {
      if (!values || !values.length) {
        return '-'
      }
      return values.map(item => Number(item || 0).toLocaleString()).join(' / ')
    },
    replayTraceText(row) {
      if (!row) {
        return '-'
      }
      if (row.traceStartTime) {
        return row.traceStartTime + ' 至 ' + (row.traceEndTime || '当前')
      }
      return row.expireTime ? '过期 ' + row.expireTime : '-'
    },
    walletTypeText(value) {
      const item = this.walletOptions.find(option => option.value === value)
      return item ? item.label : (value || '-')
    },
    bizTypeText(value) {
      const item = this.bizOptions.find(option => option.value === value)
      return item ? item.label : (value || '-')
    },
    feeTypeText(value) {
      const map = {
        AA: '均摊',
        OWNER: '房主',
        WINNER: '赢家',
        GAME_ROOM: '整场房费',
        SETTLE: '结算房费',
        ROOM_FEE: '房费',
        COUPON: '券抵扣'
      }
      return map[value] || value || '-'
    }
  }
}
</script>

<style scoped>
.amount-positive {
  color: #67c23a;
}

.amount-negative {
  color: #f56c6c;
}

.amount-strong {
  margin-right: 10px;
  color: #303133;
  font-weight: 600;
}

.muted {
  color: #909399;
}

.replay-base64 {
  margin-top: 12px;
}
</style>
