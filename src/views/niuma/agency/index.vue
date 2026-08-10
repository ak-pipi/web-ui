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
            <span
              v-if="data.nodeType === 'agent'"
              class="muted"
            >邀请码: {{ data.inviteCode || '-' }}</span>
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
          <el-form-item label="工作台" prop="status">
            <el-select
              v-model="agencyQuery.status"
              placeholder="全部"
              clearable
            >
              <el-option label="可登录" :value="0" />
              <el-option label="已撤销" :value="1" />
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
          <el-table-column label="邀请码" align="center" prop="inviteCode" min-width="130">
            <template slot-scope="scope">
              <span>{{ scope.row.inviteCode || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="返佣比例" align="center" width="110">
            <template slot-scope="scope">
              <span>{{ rateText(scope.row.commissionRateBp) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="直推玩家" align="center" prop="directPlayerCount" width="90" />
          <el-table-column label="下级代理" align="center" prop="directAgentCount" width="90" />
          <el-table-column label="累计返佣" align="center" width="110">
            <template slot-scope="scope">
              <span>{{ amountText(scope.row.totalCommission) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="工作台" align="center" width="90">
            <template slot-scope="scope">
              <el-tag
                size="mini"
                :type="scope.row.workbenchStatus === 0 ? 'success' : 'danger'"
              >{{ workbenchStatusText(scope.row.workbenchStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="190" fixed="right">
            <template slot-scope="scope">
              <el-button
                v-hasPermi="['niuma:agency:rate:update']"
                type="text"
                size="mini"
                icon="el-icon-edit"
                @click="openRateDialog(scope.row)"
              >比例</el-button>
              <el-button
                v-if="overview.admin"
                v-hasPermi="['niuma:agency:status:update']"
                type="text"
                size="mini"
                :icon="scope.row.workbenchStatus === 0 ? 'el-icon-lock' : 'el-icon-unlock'"
                @click="handleStatus(scope.row)"
              >{{ scope.row.workbenchStatus === 0 ? '撤销工作台' : '恢复工作台' }}</el-button>
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
              <el-option label="积分" value="gold" />
              <el-option label="保险箱" value="deposit" />
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
              <el-option label="房间押金" value="room_deposit" />
              <el-option label="存入保险箱" value="safe_deposit" />
              <el-option label="从保险箱取出" value="safe_withdraw" />
              <el-option label="转账转入" value="transfer_in" />
              <el-option label="转账转出" value="transfer_out" />
              <el-option label="提现" value="withdraw" />
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
          <el-table-column label="业务类型" align="center" min-width="130">
            <template slot-scope="scope">
              <span>{{ bizTypeText(scope.row.bizType) }}</span>
            </template>
          </el-table-column>
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
              type="primary"
              icon="el-icon-search"
              size="mini"
              @click="queryUnbindBinding"
            >查询绑定</el-button>
            <el-button
              v-hasPermi="['niuma:agency:unbind:execute']"
              type="danger"
              icon="el-icon-close"
              size="mini"
              @click="submitUnbind"
            >解除绑定</el-button>
          </el-form-item>
        </el-form>

        <el-table
          v-loading="unbindBindingLoading"
          :data="unbindBindingList"
          class="section-table"
          size="small"
        >
          <el-table-column label="玩家ID" align="center" prop="playerId" min-width="120" />
          <el-table-column label="昵称" align="center" prop="nickname" min-width="120" />
          <el-table-column label="当前代理" align="center" min-width="160">
            <template slot-scope="scope">
              <span>{{ scope.row.agentNickname || scope.row.agentPlayerId }}</span>
              <span class="muted">({{ scope.row.agentPlayerId }})</span>
            </template>
          </el-table-column>
          <el-table-column label="一级代理" align="center" min-width="160">
            <template slot-scope="scope">
              <span>{{ scope.row.rootAgentNickname || scope.row.rootAgentPlayerId }}</span>
              <span class="muted">({{ scope.row.rootAgentPlayerId }})</span>
            </template>
          </el-table-column>
          <el-table-column label="绑定来源" align="center" prop="bindSource" min-width="100" />
          <el-table-column label="绑定时间" align="center" prop="bindAt" min-width="160" />
          <el-table-column label="操作" align="center" width="100">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="selectUnbindBinding(scope.row)">选择</el-button>
            </template>
          </el-table-column>
        </el-table>

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

      <el-tab-pane label="统计" name="stats">
        <el-form
          :model="agencyStatQuery"
          size="small"
          :inline="true"
          label-width="70px"
        >
          <el-form-item label="关键字">
            <el-input
              v-model="agencyStatQuery.keyword"
              placeholder="玩家ID/名称"
              clearable
              @keyup.enter.native="handleAgencyStatQuery"
            />
          </el-form-item>
          <el-form-item label="统计时间">
            <el-date-picker
              v-model="agencyStatRange"
              type="datetimerange"
              value-format="yyyy-MM-dd HH:mm:ss"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleAgencyStatQuery">查询</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetAgencyStatQuery">重置</el-button>
            <el-button
              v-if="agencyStatParentId"
              icon="el-icon-back"
              size="mini"
              @click="resetAgencyStatParent"
            >返回上级</el-button>
          </el-form-item>
          <el-form-item label="范围">
            <span class="inline-tip">{{ agencyStatParentText() }}</span>
          </el-form-item>
        </el-form>

        <el-tabs v-model="agencyStatTab" @tab-click="handleAgencyStatTabClick">
          <el-tab-pane label="直邀玩家" name="member" />
          <el-tab-pane label="合伙人列表" name="group" />
        </el-tabs>

        <el-table
          v-loading="agencyStatLoading"
          :data="agencyStatList"
          show-summary
          :summary-method="agencyStatSummaryMethod"
        >
          <el-table-column label="个人信息" prop="playerId" min-width="260">
            <template slot-scope="scope">
              <div class="player-info-cell">
                <img v-if="scope.row.avatar" :src="scope.row.avatar" class="player-avatar">
                <span v-else class="player-avatar avatar-fallback">{{ avatarInitial(scope.row) }}</span>
                <span>
                  <span class="player-name">{{ scope.row.nickname || scope.row.account || '-' }}</span>
                  <span class="muted">ID: {{ scope.row.playerId || '-' }}</span>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="输赢比赛分" prop="scoreDelta" align="center" width="160">
            <template slot-scope="scope">
              <span>{{ agencyStatScoreText(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="场次" prop="roundCount" align="center" width="130">
            <template slot-scope="scope">
              <span>{{ amountText(scope.row.roundCount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="130">
            <template slot-scope="scope">
              <el-button
                v-if="agencyStatTab === 'group'"
                type="text"
                size="mini"
                icon="el-icon-view"
                @click="viewAgencyStatChildren(scope.row)"
              >查看玩家</el-button>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="agencyStatTotal > 0"
          :total="agencyStatTotal"
          :page.sync="agencyStatQuery.pageNum"
          :limit.sync="agencyStatQuery.pageSize"
          @pagination="loadAgencyStats"
        />
      </el-tab-pane>

      <el-tab-pane label="三天回放" name="replay">
        <el-form
          ref="replayQueryForm"
          :model="replayQuery"
          size="small"
          :inline="true"
          label-width="70px"
        >
          <el-form-item label="玩法" prop="gameType">
            <el-select v-model="replayQuery.gameType" placeholder="请选择玩法">
              <el-option
                v-for="item in replayGameOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="玩家ID" prop="playerId">
            <el-input
              v-model="replayQuery.playerId"
              placeholder="可选"
              clearable
              @keyup.enter.native="handleReplayQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleReplayQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetReplayQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="replayLoading" :data="replayList">
          <el-table-column label="记录ID" align="center" prop="id" width="90" />
          <el-table-column label="玩法" align="center" prop="gameName" min-width="100" />
          <el-table-column label="房号" align="center" prop="number" min-width="100" />
          <el-table-column label="局号" align="center" prop="roundNo" width="80" />
          <el-table-column label="玩家" align="center" min-width="220">
            <template slot-scope="scope">
              <span>{{ replayPlayersText(scope.row.players) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="分数" align="center" min-width="160">
            <template slot-scope="scope">
              <span>{{ replayArrayText(scope.row.scores) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="输赢积分" align="center" min-width="160">
            <template slot-scope="scope">
              <span>{{ replayArrayText(scope.row.winGolds) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时间" align="center" prop="time" min-width="150" />
          <el-table-column label="追溯窗口" align="center" min-width="260">
            <template slot-scope="scope">
              <span>{{ replayTraceText(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="mini"
                :disabled="!scope.row.hasReplay"
                @click="openReplayPlayback(scope.row)"
              >查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="replayTotal > 0"
          :total="replayTotal"
          :page.sync="replayQuery.pageNum"
          :limit.sync="replayQuery.pageSize"
          @pagination="loadReplayList"
        />
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
          <el-input v-model="createForm.playerId" placeholder="请输入已注册玩家ID" />
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
          <el-input
            v-model="adjustForm.playerId"
            placeholder="请输入玩家ID"
            clearable
            @blur="loadAdjustBalance"
          >
            <el-button
              slot="append"
              icon="el-icon-refresh"
              :loading="adjustBalanceLoading"
              @click="loadAdjustBalance"
            />
          </el-input>
        </el-form-item>
        <el-form-item label="当前积分">
          <span v-if="adjustBalanceLoaded" class="amount-strong">{{ amountText(adjustForm.currentGold) }}</span>
          <span v-else class="muted">输入玩家ID后查询</span>
        </el-form-item>
        <el-form-item label="钱包" prop="walletType">
          <el-select v-model="adjustForm.walletType" placeholder="请选择钱包">
            <el-option label="积分" value="gold" />
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

    <el-dialog
      title="对局回放"
      :visible.sync="replayDialogVisible"
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
        <el-descriptions-item label="格式">{{ replayPlayback.format }}</el-descriptions-item>
        <el-descriptions-item label="编码">{{ replayPlayback.codec }}</el-descriptions-item>
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
  </div>
</template>

<script>
import {
  adjustAgencyWallet,
  createAgency,
  executeAgencyUnbind,
  getAgencyCommissionSummary,
  getAgencyOverview,
  getAgencyReplayPlayback,
  getAgencyTree,
  getAgencyWalletBalance,
  listAgency,
  listAgencyBinding,
  listAgencyCommission,
  listAgencyReplay,
  listAgencyStat,
  listAgencyUnbindRequest,
  listAgencyWalletLedger,
  requestAgencyUnbind,
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
      unbindBindingLoading: false,
      unbindBindingList: [],
      selectedUnbindBinding: null,
      unbindQuery: {
        pageNum: 1,
        pageSize: 10
      },
      unbindForm: {
        playerId: null,
        reason: null
      },
      agencyStatTab: 'member',
      agencyStatLoading: false,
      agencyStatList: [],
      agencyStatTotal: 0,
      agencyStatRange: [],
      agencyStatSummary: {
        totalScoreDelta: 0,
        totalRounds: 0
      },
      agencyStatParentId: null,
      agencyStatParentName: null,
      agencyStatQuery: {
        keyword: null,
        pageNum: 1,
        pageSize: 10
      },
      replayLoading: false,
      replayList: [],
      replayTotal: 0,
      replayDialogVisible: false,
      replayPlayback: null,
      replayGameOptions: [
        { label: '桃江麻将', value: 1031 },
        { label: '红中麻将', value: 1032 },
        { label: '跑得快', value: 1033 },
        { label: '长沙麻将', value: 1034 }
      ],
      replayQuery: {
        gameType: 1031,
        playerId: null,
        pageNum: 1,
        pageSize: 10
      },
      createDialogVisible: false,
      createForm: {
        playerId: null,
        agentType: 2,
        superiorPlayerId: null,
        commissionRateBp: 0
      },
      rateDialogVisible: false,
      rateForm: {
        agentPlayerId: null,
        commissionRateBp: 0,
        reason: null
      },
      adjustDialogVisible: false,
      adjustBalanceLoading: false,
      adjustBalanceLoaded: false,
      adjustForm: {
        playerId: null,
        currentGold: 0,
        walletType: 'gold',
        action: 'increase',
        amount: 100,
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
        action: [{ required: true, message: '操作类型不能为空', trigger: 'change' }],
        amount: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '原因不能为空', trigger: 'blur' }]
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
      } else if (tab.name === 'stats') {
        this.loadAgencyStats()
      } else if (tab.name === 'replay') {
        this.loadReplayList()
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
        commissionRateBp: 0
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
          this.$modal.msgSuccess('新增代理成功，工作台账号：' + (response.workbenchAccount || ''))
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
      const status = row.workbenchStatus === 0 ? 1 : 0
      const text = status === 0 ? '恢复工作台' : '撤销工作台'
      this.$confirm('确认' + text + '账号 ' + row.playerId + '？', '系统提示', {
        type: 'warning'
      }).then(() => {
        return updateAgencyStatus(row.playerId, {
          status: status,
          reason: text
        })
      }).then(() => {
        this.$modal.msgSuccess(text + '成功')
        this.afterConfigChanged()
      }).catch(() => {})
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
        currentGold: 0,
        walletType: 'gold',
        action: 'increase',
        amount: 100,
        reason: null
      }
      this.adjustBalanceLoaded = false
      this.adjustDialogVisible = true
      this.$nextTick(() => {
        this.resetForm('adjustForm')
      })
    },
    loadAdjustBalance() {
      if (this.adjustBalanceLoading) {
        return
      }
      if (!this.adjustForm.playerId) {
        this.adjustForm.currentGold = 0
        this.adjustBalanceLoaded = false
        return
      }
      this.adjustBalanceLoading = true
      getAgencyWalletBalance({ playerId: this.adjustForm.playerId }).then(response => {
        this.adjustForm.currentGold = response && response.gold != null ? response.gold : 0
        this.adjustBalanceLoaded = true
      }).finally(() => {
        this.adjustBalanceLoading = false
      }).catch(() => {
        this.adjustForm.currentGold = 0
        this.adjustBalanceLoaded = false
      })
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
        adjustAgencyWallet(payload).then(() => {
          this.adjustDialogVisible = false
          this.$modal.msgSuccess('积分调整成功')
          this.loadWalletList()
          this.loadOverview()
        }).catch(() => {})
      })
    },
    submitUnbind() {
      this.$refs.unbindForm.validate(valid => {
        if (!valid) {
          return
        }
        if (!this.selectedUnbindBinding || this.selectedUnbindBinding.playerId !== this.unbindForm.playerId) {
          this.$modal.msgError('请先查询并选择要解除的有效绑定关系')
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
          this.unbindBindingList = []
          this.selectedUnbindBinding = null
          this.loadUnbindList()
          this.loadBindingList()
          this.afterConfigChanged()
        }).catch(() => {})
      })
    },
    queryUnbindBinding() {
      if (!this.unbindForm.playerId) {
        this.$modal.msgError('请输入玩家ID')
        return
      }
      this.unbindBindingLoading = true
      this.selectedUnbindBinding = null
      listAgencyBinding({
        playerId: this.unbindForm.playerId,
        status: 'active',
        pageNum: 1,
        pageSize: 10
      }).then(response => {
        this.unbindBindingList = response.records || []
        if (this.unbindBindingList.length === 1) {
          this.selectUnbindBinding(this.unbindBindingList[0])
        } else if (this.unbindBindingList.length === 0) {
          this.$modal.msgWarning('未查询到有效绑定关系')
        }
      }).finally(() => {
        this.unbindBindingLoading = false
      })
    },
    selectUnbindBinding(row) {
      this.selectedUnbindBinding = row
      this.unbindForm.playerId = row.playerId
      this.$modal.msgSuccess('已选择玩家 ' + row.playerId + ' 的绑定关系')
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
    loadAgencyStats() {
      this.agencyStatLoading = true
      this.agencyStatSummary = {
        totalScoreDelta: 0,
        totalRounds: 0
      }
      const query = this.buildTimeQuery(this.agencyStatQuery, this.agencyStatRange)
      Object.assign(query, {
        statType: this.agencyStatTab,
        parentPlayerId: this.agencyStatParentId || null
      })
      listAgencyStat(query).then(response => {
        const data = response || {}
        this.agencyStatList = data.records || []
        this.agencyStatTotal = data.total || 0
        this.agencyStatSummary = {
          totalScoreDelta: data.totalScoreDelta || 0,
          totalRounds: data.totalRounds || 0
        }
      }).finally(() => {
        this.agencyStatLoading = false
      })
    },
    handleAgencyStatTabClick(tab) {
      if (tab && tab.name === 'group') {
        this.agencyStatParentId = null
        this.agencyStatParentName = null
      }
      this.agencyStatQuery.pageNum = 1
      this.loadAgencyStats()
    },
    handleAgencyStatQuery() {
      this.agencyStatQuery.pageNum = 1
      this.loadAgencyStats()
    },
    resetAgencyStatQuery() {
      this.agencyStatQuery.keyword = null
      this.agencyStatRange = []
      this.handleAgencyStatQuery()
    },
    viewAgencyStatChildren(row) {
      this.agencyStatParentId = row.playerId
      this.agencyStatParentName = row.nickname || row.account || row.playerId
      this.agencyStatTab = 'member'
      this.agencyStatQuery.pageNum = 1
      this.loadAgencyStats()
    },
    resetAgencyStatParent() {
      this.agencyStatParentId = null
      this.agencyStatParentName = null
      this.agencyStatTab = 'group'
      this.agencyStatQuery.pageNum = 1
      this.loadAgencyStats()
    },
    agencyStatParentText() {
      if (this.agencyStatParentId) {
        return (this.agencyStatParentName || this.agencyStatParentId) + ' 的线下玩家'
      }
      return this.agencyStatTab === 'group' ? '当前账号直邀合伙人' : '当前账号直邀玩家'
    },
    agencyStatScoreText(row) {
      const score = row.scoreDelta != null ? row.scoreDelta : row.score
      return this.amountText(score)
    },
    agencyStatSummaryMethod({ columns }) {
      return columns.map((column, index) => {
        if (index === 0) {
          return '总计'
        }
        if (column.property === 'scoreDelta') {
          return this.amountText(this.agencyStatSummary.totalScoreDelta)
        }
        if (column.property === 'roundCount') {
          return this.amountText(this.agencyStatSummary.totalRounds)
        }
        return ''
      })
    },
    loadReplayList() {
      this.replayLoading = true
      listAgencyReplay(this.replayQuery).then(response => {
        this.replayList = response.records || []
        this.replayTotal = response.total || 0
      }).finally(() => {
        this.replayLoading = false
      })
    },
    handleReplayQuery() {
      this.replayQuery.pageNum = 1
      this.loadReplayList()
    },
    resetReplayQuery() {
      this.resetForm('replayQueryForm')
      this.replayQuery.gameType = 1031
      this.handleReplayQuery()
    },
    openReplayPlayback(row) {
      getAgencyReplayPlayback({
        id: row.id,
        gameType: row.gameType,
        playerId: this.replayQuery.playerId
      }).then(response => {
        this.replayPlayback = response.data || null
        this.replayDialogVisible = true
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
    avatarInitial(row) {
      const name = row.nickname || row.account || row.playerId || '-'
      return name.substring(0, 1)
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
    workbenchStatusText(value) {
      return value === 0 ? '可登录' : '已撤销'
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
        return '积分'
      }
      if (value === 'deposit') {
        return '保险箱'
      }
      return value || '-'
    },
    bizTypeText(value) {
      const map = {
        game_settle: '游戏结算',
        room_fee: '房费',
        room_deposit: '房间押金',
        agency_commission: '代理返佣',
        admin_adjust: '后台调整',
        safe_deposit: '存入保险箱',
        safe_withdraw: '从保险箱取出',
        transfer_in: '转账转入',
        transfer_out: '转账转出',
        recharge: '充值',
        withdraw: '提现'
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

.section-table {
  margin-bottom: 14px;
}

.replay-base64 {
  margin-top: 14px;
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

.amount-strong {
  margin-right: 10px;
  color: #303133;
  font-weight: 600;
}

.player-info-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.player-avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 6px;
  object-fit: cover;
  background: #f2f3f5;
}

.avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #67c23a;
  font-weight: 600;
}

.player-name {
  display: block;
  color: #303133;
  line-height: 20px;
}
</style>
