<template>
  <div class="app-container agency-page">
    <div class="metric-grid">
      <div class="metric-item">
        <div class="metric-label">代理数量</div>
        <div class="metric-value">{{ overview.agentCount || 0 }}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">线路玩家</div>
        <div class="metric-value">{{ overview.playerCount || 0 }}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">今日房费</div>
        <div class="metric-value">{{ amountText(overview.todayRoomFee) }}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">今日返佣</div>
        <div class="metric-value">{{ amountText(overview.todayCommission) }}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">累计房费</div>
        <div class="metric-value">{{ amountText(overview.totalRoomFee) }}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">累计返佣</div>
        <div class="metric-value">{{ amountText(overview.totalCommission) }}</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="线路树" name="tree">
        <div class="toolbar-row">
          <el-button
            icon="el-icon-refresh"
            size="mini"
            @click="loadTree"
          >刷新</el-button>
        </div>
        <el-tree
          v-loading="treeLoading"
          :data="treeData"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
        >
          <span slot-scope="{ data }" class="tree-node">
            <span>{{ data.nickname || data.playerId }}</span>
            <el-tag
              v-if="data.nodeType === 'root'"
              size="mini"
              type="info"
            >平台</el-tag>
            <el-tag
              v-else-if="data.nodeType === 'agent'"
              size="mini"
              type="success"
            >{{ agentTypeText(data.agentType) }}</el-tag>
            <el-tag
              v-else
              size="mini"
            >玩家</el-tag>
            <span class="muted">ID: {{ data.playerId }}</span>
            <span
              v-if="data.nodeType === 'agent'"
              class="muted"
            >返佣: {{ rateText(data.commissionRateBp) }}</span>
          </span>
        </el-tree>
      </el-tab-pane>

      <el-tab-pane label="代理配置" name="agents">
        <el-form
          ref="agencyQueryForm"
          :model="agencyQuery"
          size="small"
          :inline="true"
          label-width="68px"
        >
          <el-form-item label="玩家ID" prop="playerId">
            <el-input
              v-model="agencyQuery.playerId"
              placeholder="请输入玩家ID"
              clearable
              @keyup.enter.native="handleAgencyQuery"
            />
          </el-form-item>
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="agencyQuery.nickname"
              placeholder="请输入昵称"
              clearable
              @keyup.enter.native="handleAgencyQuery"
            />
          </el-form-item>
          <el-form-item label="类型" prop="agentType">
            <el-select
              v-model="agencyQuery.agentType"
              placeholder="全部"
              clearable
            >
              <el-option label="一级代理" :value="1" />
              <el-option label="二级代理" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="agencyQuery.status"
              placeholder="全部"
              clearable
            >
              <el-option label="正常" :value="0" />
              <el-option label="停用" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              size="mini"
              @click="handleAgencyQuery"
            >搜索</el-button>
            <el-button
              icon="el-icon-refresh"
              size="mini"
              @click="resetAgencyQuery"
            >重置</el-button>
            <el-button
              v-hasPermi="['niuma:agency:create:l1', 'niuma:agency:create:l2']"
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="openCreateDialog"
            >新增代理</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="agencyLoading" :data="agencyList">
          <el-table-column label="玩家ID" align="center" prop="playerId" min-width="120" />
          <el-table-column label="昵称" align="center" prop="nickname" min-width="120" />
          <el-table-column label="类型" align="center" width="100">
            <template slot-scope="scope">
              <el-tag
                size="mini"
                :type="scope.row.agentType === 1 ? 'success' : 'warning'"
              >{{ agentTypeText(scope.row.agentType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上级ID" align="center" prop="superiorId" min-width="120" />
          <el-table-column label="上级昵称" align="center" prop="superiorNickname" min-width="120" />
          <el-table-column label="返佣比例" align="center" width="110">
            <template slot-scope="scope">
              <span>{{ rateText(scope.row.commissionRateBp) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="邀请码" align="center" prop="inviteCode" min-width="120" />
          <el-table-column label="直推玩家" align="center" prop="directPlayerCount" width="90" />
          <el-table-column label="下级代理" align="center" prop="directAgentCount" width="90" />
          <el-table-column label="累计返佣" align="center" width="110">
            <template slot-scope="scope">
              <span>{{ amountText(scope.row.totalCommission) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="90">
            <template slot-scope="scope">
              <el-tag
                size="mini"
                :type="scope.row.status === 0 ? 'success' : 'danger'"
              >{{ statusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="260" fixed="right">
            <template slot-scope="scope">
              <el-button
                v-hasPermi="['niuma:agency:rate:update']"
                type="text"
                size="mini"
                icon="el-icon-edit"
                @click="openRateDialog(scope.row)"
              >比例</el-button>
              <el-button
                v-hasPermi="['niuma:agency:invite:update']"
                type="text"
                size="mini"
                icon="el-icon-refresh"
                @click="handleResetInvite(scope.row)"
              >邀请码</el-button>
              <el-button
                v-hasPermi="['niuma:agency:status:update']"
                type="text"
                size="mini"
                :icon="scope.row.status === 0 ? 'el-icon-lock' : 'el-icon-unlock'"
                @click="handleStatus(scope.row)"
              >{{ scope.row.status === 0 ? '停用' : '启用' }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="agencyTotal > 0"
          :total="agencyTotal"
          :page.sync="agencyQuery.pageNum"
          :limit.sync="agencyQuery.pageSize"
          @pagination="loadAgencyList"
        />
      </el-tab-pane>

      <el-tab-pane label="玩家绑定" name="bindings">
        <el-form
          ref="bindForm"
          :model="bindForm"
          :rules="bindRules"
          size="small"
          :inline="true"
          label-width="70px"
        >
          <el-form-item label="玩家ID" prop="playerId">
            <el-input
              v-model="bindForm.playerId"
              placeholder="请输入玩家ID"
              clearable
            />
          </el-form-item>
          <el-form-item label="邀请码" prop="inviteCode">
            <el-input
              v-model="bindForm.inviteCode"
              placeholder="请输入邀请码"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['niuma:agency:binding:update']"
              type="primary"
              icon="el-icon-link"
              size="mini"
              @click="submitBind"
            >绑定</el-button>
          </el-form-item>
        </el-form>

        <el-form
          ref="bindingQueryForm"
          :model="bindingQuery"
          size="small"
          :inline="true"
          label-width="70px"
        >
          <el-form-item label="玩家ID" prop="playerId">
            <el-input
              v-model="bindingQuery.playerId"
              placeholder="请输入玩家ID"
              clearable
              @keyup.enter.native="handleBindingQuery"
            />
          </el-form-item>
          <el-form-item label="代理ID" prop="agentPlayerId">
            <el-input
              v-model="bindingQuery.agentPlayerId"
              placeholder="请输入代理ID"
              clearable
              @keyup.enter.native="handleBindingQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="bindingQuery.status"
              placeholder="全部"
              clearable
            >
              <el-option label="有效" value="active" />
              <el-option label="已解除" value="unbound" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              size="mini"
              @click="handleBindingQuery"
            >搜索</el-button>
            <el-button
              icon="el-icon-refresh"
              size="mini"
              @click="resetBindingQuery"
            >重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="bindingLoading" :data="bindingList">
          <el-table-column label="玩家ID" align="center" prop="playerId" min-width="120" />
          <el-table-column label="昵称" align="center" prop="nickname" min-width="120" />
          <el-table-column label="直接代理ID" align="center" prop="agentPlayerId" min-width="120" />
          <el-table-column label="直接代理" align="center" prop="agentNickname" min-width="120" />
          <el-table-column label="一级代理ID" align="center" prop="rootAgentPlayerId" min-width="120" />
          <el-table-column label="来源" align="center" prop="bindSource" width="100" />
          <el-table-column label="邀请码" align="center" prop="inviteCode" width="110" />
          <el-table-column label="状态" align="center" width="100">
            <template slot-scope="scope">
              <el-tag
                size="mini"
                :type="scope.row.status === 'active' ? 'success' : 'info'"
              >{{ bindStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="绑定时间" align="center" prop="bindAt" min-width="160" />
          <el-table-column label="解除时间" align="center" prop="unbindAt" min-width="160" />
        </el-table>
        <pagination
          v-show="bindingTotal > 0"
          :total="bindingTotal"
          :page.sync="bindingQuery.pageNum"
          :limit.sync="bindingQuery.pageSize"
          @pagination="loadBindingList"
        />
      </el-tab-pane>

      <el-tab-pane label="返佣明细" name="commission">
        <div class="metric-grid compact">
          <div class="metric-item">
            <div class="metric-label">房费合计</div>
            <div class="metric-value">{{ amountText(commissionSummary.feeTotal) }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">返佣合计</div>
            <div class="metric-value">{{ amountText(commissionSummary.commissionTotal) }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">房费笔数</div>
            <div class="metric-value">{{ commissionSummary.roomFeeCount || 0 }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">分账笔数</div>
            <div class="metric-value">{{ commissionSummary.commissionCount || 0 }}</div>
          </div>
        </div>

        <el-form
          ref="commissionQueryForm"
          :model="commissionQuery"
          size="small"
          :inline="true"
          label-width="82px"
        >
          <el-form-item label="房间ID" prop="roomId">
            <el-input
              v-model="commissionQuery.roomId"
              placeholder="请输入房间ID"
              clearable
              @keyup.enter.native="handleCommissionQuery"
            />
          </el-form-item>
          <el-form-item label="付费玩家" prop="feePlayerId">
            <el-input
              v-model="commissionQuery.feePlayerId"
              placeholder="请输入玩家ID"
              clearable
              @keyup.enter.native="handleCommissionQuery"
            />
          </el-form-item>
          <el-form-item label="代理ID" prop="agentPlayerId">
            <el-input
              v-model="commissionQuery.agentPlayerId"
              placeholder="请输入代理ID"
              clearable
              @keyup.enter.native="handleCommissionQuery"
            />
          </el-form-item>
          <el-form-item label="时间">
            <el-date-picker
              v-model="commissionRange"
              type="datetimerange"
              value-format="yyyy-MM-dd HH:mm:ss"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              size="mini"
              @click="handleCommissionQuery"
            >搜索</el-button>
            <el-button
              icon="el-icon-refresh"
              size="mini"
              @click="resetCommissionQuery"
            >重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="commissionLoading" :data="commissionList">
          <el-table-column label="流水ID" align="center" prop="id" width="90" />
          <el-table-column label="房间ID" align="center" prop="roomId" min-width="120" />
          <el-table-column label="付费玩家" align="center" prop="feePlayerId" min-width="120" />
          <el-table-column label="玩家昵称" align="center" prop="feePlayerNickname" min-width="120" />
          <el-table-column label="分账对象" align="center" prop="agentPlayerId" min-width="120" />
          <el-table-column label="对象昵称" align="center" prop="agentNickname" min-width="120" />
          <el-table-column label="层级" align="center" width="90">
            <template slot-scope="scope">
              <span>{{ agentTypeText(scope.row.agentType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="房费" align="center" width="90">
            <template slot-scope="scope">
              <span>{{ amountText(scope.row.feeAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="本层比例" align="center" width="100">
            <template slot-scope="scope">
              <span>{{ rateText(scope.row.shareRateBp) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="返佣" align="center" width="90">
            <template slot-scope="scope">
              <span>{{ amountText(scope.row.commissionAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" prop="status" width="100" />
          <el-table-column label="时间" align="center" prop="createTime" min-width="160" />
        </el-table>
        <pagination
          v-show="commissionTotal > 0"
          :total="commissionTotal"
          :page.sync="commissionQuery.pageNum"
          :limit.sync="commissionQuery.pageSize"
          @pagination="loadCommissionList"
        />
      </el-tab-pane>

      <el-tab-pane label="积分流水" name="wallet">
        <el-form
          ref="walletQueryForm"
          :model="walletQuery"
          size="small"
          :inline="true"
          label-width="80px"
        >
          <el-form-item label="玩家ID" prop="playerId">
            <el-input
              v-model="walletQuery.playerId"
              placeholder="请输入玩家ID"
              clearable
              @keyup.enter.native="handleWalletQuery"
            />
          </el-form-item>
          <el-form-item label="钱包" prop="walletType">
            <el-select
              v-model="walletQuery.walletType"
              placeholder="全部"
              clearable
            >
              <el-option label="金币" value="gold" />
              <el-option label="保险箱" value="deposit" />
              <el-option label="钻石" value="diamond" />
            </el-select>
          </el-form-item>
          <el-form-item label="业务" prop="bizType">
            <el-select
              v-model="walletQuery.bizType"
              placeholder="全部"
              clearable
            >
              <el-option label="代理返佣" value="agency_commission" />
              <el-option label="后台调整" value="admin_adjust" />
              <el-option label="游戏结算" value="game_settle" />
              <el-option label="房费" value="room_fee" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间">
            <el-date-picker
              v-model="walletRange"
              type="datetimerange"
              value-format="yyyy-MM-dd HH:mm:ss"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              size="mini"
              @click="handleWalletQuery"
            >搜索</el-button>
            <el-button
              icon="el-icon-refresh"
              size="mini"
              @click="resetWalletQuery"
            >重置</el-button>
            <el-button
              v-hasPermi="['niuma:agency:wallet:adjust']"
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="openAdjustDialog"
            >积分调整</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="walletLoading" :data="walletList">
          <el-table-column label="流水ID" align="center" prop="id" width="90" />
          <el-table-column label="玩家ID" align="center" prop="userId" min-width="120" />
          <el-table-column label="钱包" align="center" width="100">
            <template slot-scope="scope">
              <span>{{ walletTypeText(scope.row.walletType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="变动" align="center" width="100">
            <template slot-scope="scope">
              <span>{{ amountText(scope.row.changeAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="余额" align="center" width="100">
            <template slot-scope="scope">
              <span>{{ amountText(scope.row.balanceAfter) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="业务类型" align="center" prop="bizType" min-width="130" />
          <el-table-column label="业务ID" align="center" prop="bizId" min-width="160" />
          <el-table-column label="备注" align="center" prop="remark" min-width="180" />
          <el-table-column label="时间" align="center" prop="createTime" min-width="160" />
        </el-table>
        <pagination
          v-show="walletTotal > 0"
          :total="walletTotal"
          :page.sync="walletQuery.pageNum"
          :limit.sync="walletQuery.pageSize"
          @pagination="loadWalletList"
        />
      </el-tab-pane>

      <el-tab-pane label="解绑闭环" name="unbind">
        <el-form
          ref="unbindForm"
          :model="unbindForm"
          :rules="unbindRules"
          size="small"
          :inline="true"
          label-width="70px"
        >
          <el-form-item label="玩家ID" prop="playerId">
            <el-input
              v-model="unbindForm.playerId"
              placeholder="请输入玩家ID"
              clearable
            />
          </el-form-item>
          <el-form-item label="原因" prop="reason">
            <el-input
              v-model="unbindForm.reason"
              placeholder="请输入原因"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['niuma:agency:unbind:execute']"
              type="danger"
              icon="el-icon-close"
              size="mini"
              @click="submitUnbind"
            >解除绑定</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="unbindLoading" :data="unbindList">
          <el-table-column label="申请ID" align="center" prop="id" width="90" />
          <el-table-column label="玩家ID" align="center" prop="playerId" min-width="120" />
          <el-table-column label="当前代理" align="center" prop="currentAgentPlayerId" min-width="120" />
          <el-table-column label="一级代理" align="center" prop="scopeRootPlayerId" min-width="120" />
          <el-table-column label="原因" align="center" prop="reason" min-width="180" />
          <el-table-column label="状态" align="center" prop="status" width="110" />
          <el-table-column label="申请时间" align="center" prop="createTime" min-width="160" />
          <el-table-column label="执行时间" align="center" prop="executeTime" min-width="160" />
          <el-table-column label="操作" align="center" width="100" fixed="right">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.status === 'approved' || scope.row.status === 'pending'"
                v-hasPermi="['niuma:agency:unbind:execute']"
                type="text"
                size="mini"
                icon="el-icon-check"
                @click="handleExecuteUnbind(scope.row)"
              >执行</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="unbindTotal > 0"
          :total="unbindTotal"
          :page.sync="unbindQuery.pageNum"
          :limit.sync="unbindQuery.pageSize"
          @pagination="loadUnbindList"
        />
      </el-tab-pane>

      <el-tab-pane label="玩家统计" name="stats">
        <el-form
          :model="statsQuery"
          size="small"
          :inline="true"
          label-width="70px"
        >
          <el-form-item label="玩家ID">
            <el-input
              v-model="statsQuery.playerId"
              placeholder="请输入玩家ID"
              clearable
              @keyup.enter.native="loadPlayerStats"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              size="mini"
              @click="loadPlayerStats"
            >查询</el-button>
          </el-form-item>
        </el-form>
        <div class="metric-grid compact">
          <div class="metric-item">
            <div class="metric-label">总局数</div>
            <div class="metric-value">{{ playerStats.totalRounds || 0 }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">胜局</div>
            <div class="metric-value">{{ playerStats.winCount || 0 }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">负局</div>
            <div class="metric-value">{{ playerStats.loseCount || 0 }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">平局</div>
            <div class="metric-value">{{ playerStats.drawCount || 0 }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">胜率</div>
            <div class="metric-value">{{ playerStats.winRate || 0 }}%</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      title="新增代理"
      :visible.sync="createDialogVisible"
      width="520px"
      append-to-body
    >
      <el-form
        ref="createForm"
        :model="createForm"
        :rules="createRules"
        label-width="120px"
      >
        <el-form-item label="玩家ID" prop="playerId">
          <el-input v-model="createForm.playerId" placeholder="请输入玩家ID" />
        </el-form-item>
        <el-form-item label="代理类型" prop="agentType">
          <el-radio-group v-model="createForm.agentType">
            <el-radio :label="1">一级代理</el-radio>
            <el-radio :label="2">二级代理</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="createForm.agentType === 2"
          label="上级代理ID"
          prop="superiorPlayerId"
        >
          <el-input v-model="createForm.superiorPlayerId" placeholder="默认使用当前代理身份" />
        </el-form-item>
        <el-form-item label="返佣比例" prop="commissionRateBp">
          <el-input-number
            v-model="createForm.commissionRateBp"
            :min="0"
            :max="10000"
            :step="100"
            controls-position="right"
          />
          <span class="inline-tip">{{ rateText(createForm.commissionRateBp) }}</span>
        </el-form-item>
        <el-form-item label="后台用户ID" prop="sysUserId">
          <el-input-number
            v-model="createForm.sysUserId"
            :min="1"
            :controls="false"
            controls-position="right"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="更新返佣比例"
      :visible.sync="rateDialogVisible"
      width="480px"
      append-to-body
    >
      <el-form
        ref="rateForm"
        :model="rateForm"
        :rules="rateRules"
        label-width="120px"
      >
        <el-form-item label="代理玩家">
          <span>{{ rateForm.agentPlayerId }}</span>
        </el-form-item>
        <el-form-item label="返佣比例" prop="commissionRateBp">
          <el-input-number
            v-model="rateForm.commissionRateBp"
            :min="0"
            :max="10000"
            :step="100"
            controls-position="right"
          />
          <span class="inline-tip">{{ rateText(rateForm.commissionRateBp) }}</span>
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="rateForm.reason" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRate">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="积分调整"
      :visible.sync="adjustDialogVisible"
      width="520px"
      append-to-body
    >
      <el-form
        ref="adjustForm"
        :model="adjustForm"
        :rules="adjustRules"
        label-width="100px"
      >
        <el-form-item label="玩家ID" prop="playerId">
          <el-input v-model="adjustForm.playerId" placeholder="请输入玩家ID" />
        </el-form-item>
        <el-form-item label="钱包" prop="walletType">
          <el-select v-model="adjustForm.walletType" placeholder="请选择钱包">
            <el-option label="金币" value="gold" />
            <el-option label="保险箱" value="deposit" />
            <el-option label="钻石" value="diamond" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整金额" prop="amount">
          <el-input-number
            v-model="adjustForm.amount"
            :min="-999999999"
            :max="999999999"
            :step="100"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="adjustForm.reason" placeholder="请输入原因" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  adjustAgencyWallet,
  bindPlayerByInviteCode,
  createAgency,
  executeAgencyUnbind,
  getAgencyCommissionSummary,
  getAgencyOverview,
  getAgencyPlayerStats,
  getAgencyTree,
  listAgency,
  listAgencyBinding,
  listAgencyCommission,
  listAgencyUnbindRequest,
  listAgencyWalletLedger,
  requestAgencyUnbind,
  resetAgencyInviteCode,
  updateAgencyRate,
  updateAgencyStatus
} from '@/api/niuma/agency'

export default {
  name: 'AgencyWorkbench',
  data() {
    return {
      activeTab: 'tree',
      overview: {},
      treeLoading: false,
      treeData: [],
      agencyLoading: false,
      agencyList: [],
      agencyTotal: 0,
      agencyQuery: {
        playerId: null,
        nickname: null,
        agentType: null,
        status: null,
        pageNum: 1,
        pageSize: 10
      },
      bindingLoading: false,
      bindingList: [],
      bindingTotal: 0,
      bindingQuery: {
        playerId: null,
        agentPlayerId: null,
        status: null,
        pageNum: 1,
        pageSize: 10
      },
      bindForm: {
        playerId: null,
        inviteCode: null
      },
      commissionLoading: false,
      commissionList: [],
      commissionTotal: 0,
      commissionSummary: {},
      commissionRange: [],
      commissionQuery: {
        roomId: null,
        feePlayerId: null,
        agentPlayerId: null,
        pageNum: 1,
        pageSize: 10
      },
      walletLoading: false,
      walletList: [],
      walletTotal: 0,
      walletRange: [],
      walletQuery: {
        playerId: null,
        walletType: null,
        bizType: null,
        pageNum: 1,
        pageSize: 10
      },
      unbindLoading: false,
      unbindList: [],
      unbindTotal: 0,
      unbindQuery: {
        pageNum: 1,
        pageSize: 10
      },
      unbindForm: {
        playerId: null,
        reason: null
      },
      statsQuery: {
        playerId: null
      },
      playerStats: {},
      createDialogVisible: false,
      createForm: {
        playerId: null,
        agentType: 2,
        superiorPlayerId: null,
        commissionRateBp: 0,
        sysUserId: undefined
      },
      rateDialogVisible: false,
      rateForm: {
        agentPlayerId: null,
        commissionRateBp: 0,
        reason: null
      },
      adjustDialogVisible: false,
      adjustForm: {
        playerId: null,
        walletType: 'gold',
        amount: 0,
        reason: null
      },
      createRules: {
        playerId: [{ required: true, message: '玩家ID不能为空', trigger: 'blur' }],
        agentType: [{ required: true, message: '代理类型不能为空', trigger: 'change' }],
        commissionRateBp: [{ required: true, message: '返佣比例不能为空', trigger: 'blur' }]
      },
      rateRules: {
        commissionRateBp: [{ required: true, message: '返佣比例不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '原因不能为空', trigger: 'blur' }]
      },
      adjustRules: {
        playerId: [{ required: true, message: '玩家ID不能为空', trigger: 'blur' }],
        walletType: [{ required: true, message: '钱包不能为空', trigger: 'change' }],
        amount: [{ required: true, message: '调整金额不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '原因不能为空', trigger: 'blur' }]
      },
      bindRules: {
        playerId: [{ required: true, message: '玩家ID不能为空', trigger: 'blur' }],
        inviteCode: [{ required: true, message: '邀请码不能为空', trigger: 'blur' }]
      },
      unbindRules: {
        playerId: [{ required: true, message: '玩家ID不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '原因不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.loadOverview()
    this.loadTree()
    this.loadAgencyList()
  },
  methods: {
    handleTabClick(tab) {
      if (tab.name === 'tree') {
        this.loadTree()
      } else if (tab.name === 'agents') {
        this.loadAgencyList()
      } else if (tab.name === 'bindings') {
        this.loadBindingList()
      } else if (tab.name === 'commission') {
        this.loadCommissionList()
      } else if (tab.name === 'wallet') {
        this.loadWalletList()
      } else if (tab.name === 'unbind') {
        this.loadUnbindList()
      }
    },
    loadOverview() {
      getAgencyOverview().then(response => {
        this.overview = response || {}
      })
    },
    loadTree() {
      this.treeLoading = true
      getAgencyTree().then(response => {
        this.treeData = response.records || []
      }).finally(() => {
        this.treeLoading = false
      })
    },
    loadAgencyList() {
      this.agencyLoading = true
      listAgency(this.agencyQuery).then(response => {
        this.agencyList = response.records || []
        this.agencyTotal = response.total || 0
      }).finally(() => {
        this.agencyLoading = false
      })
    },
    handleAgencyQuery() {
      this.agencyQuery.pageNum = 1
      this.loadAgencyList()
    },
    resetAgencyQuery() {
      this.resetForm('agencyQueryForm')
      this.handleAgencyQuery()
    },
    openCreateDialog() {
      this.createForm = {
        playerId: null,
        agentType: 2,
        superiorPlayerId: null,
        commissionRateBp: 0,
        sysUserId: undefined
      }
      this.createDialogVisible = true
      this.$nextTick(() => {
        this.resetForm('createForm')
      })
    },
    submitCreate() {
      this.$refs.createForm.validate(valid => {
        if (!valid) {
          return
        }
        createAgency(this.createForm).then(response => {
          this.createDialogVisible = false
          this.$modal.msgSuccess('新增代理成功，邀请码：' + (response.inviteCode || ''))
          this.afterConfigChanged()
        })
      })
    },
    openRateDialog(row) {
      this.rateForm = {
        agentPlayerId: row.playerId,
        commissionRateBp: row.commissionRateBp || 0,
        reason: null
      }
      this.rateDialogVisible = true
      this.$nextTick(() => {
        this.resetForm('rateForm')
      })
    },
    submitRate() {
      this.$refs.rateForm.validate(valid => {
        if (!valid) {
          return
        }
        const data = {
          commissionRateBp: this.rateForm.commissionRateBp,
          reason: this.rateForm.reason
        }
        updateAgencyRate(this.rateForm.agentPlayerId, data).then(() => {
          this.rateDialogVisible = false
          this.$modal.msgSuccess('返佣比例已更新')
          this.afterConfigChanged()
        })
      })
    },
    handleStatus(row) {
      const status = row.status === 0 ? 1 : 0
      const text = status === 0 ? '启用' : '停用'
      this.$confirm('确认' + text + '代理 ' + row.playerId + '？', '系统提示', {
        type: 'warning'
      }).then(() => {
        return updateAgencyStatus(row.playerId, {
          status: status,
          reason: text + '代理'
        })
      }).then(() => {
        this.$modal.msgSuccess(text + '成功')
        this.afterConfigChanged()
      }).catch(() => {})
    },
    handleResetInvite(row) {
      this.$confirm('确认重置代理 ' + row.playerId + ' 的邀请码？', '系统提示', {
        type: 'warning'
      }).then(() => {
        return resetAgencyInviteCode(row.playerId)
      }).then(response => {
        this.$modal.msgSuccess('新邀请码：' + (response.inviteCode || ''))
        this.afterConfigChanged()
      }).catch(() => {})
    },
    submitBind() {
      this.$refs.bindForm.validate(valid => {
        if (!valid) {
          return
        }
        bindPlayerByInviteCode(this.bindForm).then(() => {
          this.$modal.msgSuccess('绑定成功')
          this.bindForm = {
            playerId: null,
            inviteCode: null
          }
          this.loadBindingList()
          this.afterConfigChanged()
        })
      })
    },
    loadBindingList() {
      this.bindingLoading = true
      listAgencyBinding(this.bindingQuery).then(response => {
        this.bindingList = response.records || []
        this.bindingTotal = response.total || 0
      }).finally(() => {
        this.bindingLoading = false
      })
    },
    handleBindingQuery() {
      this.bindingQuery.pageNum = 1
      this.loadBindingList()
    },
    resetBindingQuery() {
      this.resetForm('bindingQueryForm')
      this.handleBindingQuery()
    },
    loadCommissionList() {
      this.commissionLoading = true
      const query = this.buildTimeQuery(this.commissionQuery, this.commissionRange)
      Promise.all([
        listAgencyCommission(query),
        getAgencyCommissionSummary(query)
      ]).then(([listResponse, summaryResponse]) => {
        this.commissionList = listResponse.records || []
        this.commissionTotal = listResponse.total || 0
        this.commissionSummary = summaryResponse || {}
      }).finally(() => {
        this.commissionLoading = false
      })
    },
    handleCommissionQuery() {
      this.commissionQuery.pageNum = 1
      this.loadCommissionList()
    },
    resetCommissionQuery() {
      this.commissionRange = []
      this.resetForm('commissionQueryForm')
      this.handleCommissionQuery()
    },
    loadWalletList() {
      this.walletLoading = true
      const query = this.buildTimeQuery(this.walletQuery, this.walletRange)
      listAgencyWalletLedger(query).then(response => {
        this.walletList = response.records || []
        this.walletTotal = response.total || 0
      }).finally(() => {
        this.walletLoading = false
      })
    },
    handleWalletQuery() {
      this.walletQuery.pageNum = 1
      this.loadWalletList()
    },
    resetWalletQuery() {
      this.walletRange = []
      this.resetForm('walletQueryForm')
      this.handleWalletQuery()
    },
    openAdjustDialog() {
      this.adjustForm = {
        playerId: null,
        walletType: 'gold',
        amount: 0,
        reason: null
      }
      this.adjustDialogVisible = true
      this.$nextTick(() => {
        this.resetForm('adjustForm')
      })
    },
    submitAdjust() {
      this.$refs.adjustForm.validate(valid => {
        if (!valid) {
          return
        }
        if (this.adjustForm.amount === 0) {
          this.$modal.msgError('调整金额不能为0')
          return
        }
        adjustAgencyWallet(this.adjustForm).then(() => {
          this.adjustDialogVisible = false
          this.$modal.msgSuccess('积分调整成功')
          this.loadWalletList()
          this.loadOverview()
        })
      })
    },
    submitUnbind() {
      this.$refs.unbindForm.validate(valid => {
        if (!valid) {
          return
        }
        this.$confirm('确认解除玩家 ' + this.unbindForm.playerId + ' 的代理绑定？', '系统提示', {
          type: 'warning'
        }).then(() => {
          return requestAgencyUnbind(this.unbindForm)
        }).then(() => {
          this.$modal.msgSuccess('解绑已执行')
          this.unbindForm = {
            playerId: null,
            reason: null
          }
          this.loadUnbindList()
          this.loadBindingList()
          this.afterConfigChanged()
        }).catch(() => {})
      })
    },
    loadUnbindList() {
      this.unbindLoading = true
      listAgencyUnbindRequest(this.unbindQuery).then(response => {
        this.unbindList = response.records || []
        this.unbindTotal = response.total || 0
      }).finally(() => {
        this.unbindLoading = false
      })
    },
    handleExecuteUnbind(row) {
      this.$confirm('确认执行解绑申请 ' + row.id + '？', '系统提示', {
        type: 'warning'
      }).then(() => {
        return executeAgencyUnbind(row.id)
      }).then(() => {
        this.$modal.msgSuccess('解绑执行成功')
        this.loadUnbindList()
        this.loadBindingList()
        this.afterConfigChanged()
      }).catch(() => {})
    },
    loadPlayerStats() {
      if (!this.statsQuery.playerId) {
        this.$modal.msgError('请输入玩家ID')
        return
      }
      getAgencyPlayerStats(this.statsQuery.playerId).then(response => {
        this.playerStats = response || {}
      })
    },
    afterConfigChanged() {
      this.loadOverview()
      this.loadTree()
      this.loadAgencyList()
    },
    buildTimeQuery(query, range) {
      const data = Object.assign({}, query)
      if (range && range.length === 2) {
        data.startTime = range[0]
        data.endTime = range[1]
      } else {
        data.startTime = null
        data.endTime = null
      }
      return data
    },
    amountText(value) {
      const amount = Number(value || 0)
      return amount.toLocaleString()
    },
    rateText(value) {
      const rate = Number(value || 0) / 100
      return rate.toFixed(2) + '%'
    },
    agentTypeText(value) {
      if (value === 0) {
        return '平台'
      }
      if (value === 1) {
        return '一级'
      }
      return '二级'
    },
    statusText(value) {
      return value === 0 ? '正常' : '停用'
    },
    bindStatusText(value) {
      if (value === 'active') {
        return '有效'
      }
      if (value === 'unbound') {
        return '已解除'
      }
      if (value === 'pending_unbind') {
        return '待解绑'
      }
      return value || '-'
    },
    walletTypeText(value) {
      if (value === 'gold') {
        return '金币'
      }
      if (value === 'deposit') {
        return '保险箱'
      }
      if (value === 'diamond') {
        return '钻石'
      }
      return value || '-'
    }
  }
}
</script>

<style scoped>
.agency-page {
  color: #303133;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.metric-item {
  min-height: 72px;
  padding: 14px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}

.metric-label {
  color: #909399;
  font-size: 13px;
  line-height: 18px;
}

.metric-value {
  margin-top: 8px;
  color: #1f2d3d;
  font-size: 22px;
  font-weight: 600;
  line-height: 26px;
}

.toolbar-row {
  margin-bottom: 12px;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.muted {
  color: #909399;
  font-size: 12px;
}

.inline-tip {
  margin-left: 10px;
  color: #606266;
}
</style>
