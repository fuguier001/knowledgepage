// ===== 配置 =====
const SUBJECT_CONFIG = {
  '语文': { color: '#FF6B9D', icon: '文' },
  '数学': { color: '#4A90D9', icon: '数' },
  '英语': { color: '#FFB6C1', icon: '英' },
  '政治': { color: '#E91E63', icon: '政' },
  '历史': { color: '#CE93D8', icon: '史' },
  '地理': { color: '#26C6DA', icon: '地' },
  '物理': { color: '#2196F3', icon: '物' },
  '化学': { color: '#00BCD4', icon: '化' },
  '生物': { color: '#009688', icon: '生' },
  '体育': { color: '#FF7043', icon: '体' }
};

const STAGE_COLORS = {
  '小学': '#4CAF50',
  '初中': '#2196F3',
  '高中': '#FF9800',
  '大学': '#9C27B0'
};

// ===== 状态 =====
let currentSubject = 'all';
let currentStage = 'all';
let searchQuery = '';
let expandedCardId = null;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  bindEvents();
  renderCards();
  updateStats();
});

// ===== 侧边栏 =====
function renderSidebar() {
  const subjectList = document.getElementById('subjectList');
  const subjects = getSubjectCounts();

  let html = `
    <div class="subject-item active" data-subject="all">
      <div class="subject-dot" style="background: linear-gradient(135deg, #FF6B9D, #4A90D9)"></div>
      <span class="subject-name">全部</span>
      <span class="subject-count">${knowledgeData.length}</span>
    </div>
  `;

  const orderedSubjects = Object.keys(SUBJECT_CONFIG);
  for (const subj of orderedSubjects) {
    if (subjects[subj]) {
      const cfg = SUBJECT_CONFIG[subj];
      html += `
        <div class="subject-item" data-subject="${subj}">
          <div class="subject-dot" style="background: ${cfg.color}"></div>
          <span class="subject-name">${subj}</span>
          <span class="subject-count">${subjects[subj]}</span>
        </div>
      `;
    }
  }

  subjectList.innerHTML = html;
}

function getSubjectCounts() {
  const counts = {};
  knowledgeData.forEach(item => {
    counts[item.subject] = (counts[item.subject] || 0) + 1;
  });
  return counts;
}

// ===== 事件绑定 =====
function bindEvents() {
  // 学科筛选
  document.getElementById('subjectList').addEventListener('click', e => {
    const item = e.target.closest('.subject-item');
    if (!item) return;

    document.querySelectorAll('.subject-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    currentSubject = item.dataset.subject;
    expandedCardId = null;
    renderCards();
  });

  // 学段筛选
  document.getElementById('stageFilters').addEventListener('click', e => {
    const tag = e.target.closest('.stage-tag');
    if (!tag) return;

    document.querySelectorAll('.stage-tag').forEach(el => el.classList.remove('active'));
    tag.classList.add('active');
    currentStage = tag.dataset.stage;
    expandedCardId = null;
    renderCards();
  });

  // 搜索
  const searchInput = document.getElementById('searchInput');
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim().toLowerCase();
      expandedCardId = null;
      renderCards();
    }, 200);
  });

  // 卡片展开/收起（事件委托）
  document.getElementById('cardGrid').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    // 如果点击的是详情区域内的链接，不触发收起
    if (e.target.closest('.card-detail')) return;

    const id = card.dataset.id;
    if (expandedCardId === id) {
      // 收起
      expandedCardId = null;
      collapseCard(card);
    } else {
      // 先收起之前展开的
      const prev = document.querySelector('.card.expanded');
      if (prev) {
        expandedCardId = null;
        collapseCard(prev);
      }
      // 展开新的
      expandedCardId = id;
      expandCard(card, id);
    }
  });
}

// ===== 卡片渲染 =====
function getFilteredData() {
  return knowledgeData.filter(item => {
    if (currentSubject !== 'all' && item.subject !== currentSubject) return false;
    if (currentStage !== 'all' && item.stage !== currentStage) return false;
    if (searchQuery) {
      const q = searchQuery;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.subject.toLowerCase().includes(q) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });
}

function renderCards() {
  const data = getFilteredData();
  const grid = document.getElementById('cardGrid');
  const emptyState = document.getElementById('emptyState');
  const title = document.getElementById('contentTitle');
  const count = document.getElementById('contentCount');

  if (currentSubject === 'all') {
    title.textContent = '全部知识点';
  } else {
    title.textContent = currentSubject;
  }

  count.textContent = `${data.length} 个知识点`;

  if (data.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  grid.innerHTML = data.map(item => renderCard(item)).join('');
}

function renderCard(item) {
  const cfg = SUBJECT_CONFIG[item.subject] || { color: '#888' };
  const stageClass = `stage-${item.stage}`;
  const isExpanded = expandedCardId === item.id;

  const tags = (item.tags || []).slice(0, 3).map(t =>
    `<span class="card-tag">${t}</span>`
  ).join('');

  const difficulty = Array.from({ length: 5 }, (_, i) =>
    `<span class="dot${i < item.difficulty ? ' filled' : ''}"></span>`
  ).join('');

  const detailHtml = isExpanded && item.detail ? renderDetail(item) : '';

  return `
    <div class="card${isExpanded ? ' expanded' : ''}" data-id="${item.id}" style="--card-accent: ${cfg.color}">
      <div class="card-header">
        <span class="card-subject-tag" style="background: ${cfg.color}">${item.subject}</span>
        <span class="card-stage-tag ${stageClass}">${item.stage}</span>
      </div>
      <div class="card-order">${item.order || ''}</div>
      <div class="card-title">${escapeHtml(item.title)}</div>
      <div class="card-description">${escapeHtml(item.description || '')}</div>
      <div class="card-footer">
        <div class="card-tags">${tags}</div>
        <div class="card-difficulty">${difficulty}</div>
      </div>
      <div class="card-detail-wrapper">${detailHtml}</div>
    </div>
  `;
}

// ===== 展开式详情 =====
function renderDetail(item) {
  const d = item.detail;
  if (!d) return '';

  let html = '<div class="card-detail">';

  if (d.concept) {
    html += `
      <div class="detail-section">
        <div class="detail-label">概念</div>
        <div class="detail-text">${escapeHtml(d.concept)}</div>
      </div>`;
  }

  if (d.formula) {
    html += `
      <div class="detail-section">
        <div class="detail-label">公式/定理</div>
        <div class="detail-formula">${escapeHtml(d.formula)}</div>
      </div>`;
  }

  if (d.examples && d.examples.length > 0) {
    html += `
      <div class="detail-section">
        <div class="detail-label">例题</div>
        <ul class="detail-list">
          ${d.examples.map(ex => `<li>${escapeHtml(ex)}</li>`).join('')}
        </ul>
      </div>`;
  }

  if (d.tips) {
    html += `
      <div class="detail-section">
        <div class="detail-label">易错点/提示</div>
        <div class="detail-text detail-tip">${escapeHtml(d.tips)}</div>
      </div>`;
  }

  if (d.related && d.related.length > 0) {
    html += `
      <div class="detail-section">
        <div class="detail-label">相关知识点</div>
        <div class="detail-related">
          ${d.related.map(r => `<span class="related-tag">${escapeHtml(r)}</span>`).join('')}
        </div>
      </div>`;
  }

  html += '</div>';
  return html;
}

function expandCard(cardEl, id) {
  const item = knowledgeData.find(d => d.id === id);
  if (!item || !item.detail) return;

  cardEl.classList.add('expanded');
  const wrapper = cardEl.querySelector('.card-detail-wrapper');
  wrapper.innerHTML = renderDetail(item);

  // 动画展开
  requestAnimationFrame(() => {
    wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
    wrapper.style.opacity = '1';
  });

  // 滚动到可见区域
  setTimeout(() => {
    cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 200);
}

function collapseCard(cardEl) {
  const wrapper = cardEl.querySelector('.card-detail-wrapper');
  wrapper.style.maxHeight = '0';
  wrapper.style.opacity = '0';
  setTimeout(() => {
    cardEl.classList.remove('expanded');
    wrapper.innerHTML = '';
  }, 200);
}

// ===== 统计 =====
function updateStats() {
  const stats = document.getElementById('stats');
  const subjects = getSubjectCounts();
  const stages = {};
  knowledgeData.forEach(item => {
    stages[item.stage] = (stages[item.stage] || 0) + 1;
  });

  stats.innerHTML = `
    <div class="stat-row">
      <span class="stat-label">总知识点</span>
      <span class="stat-value">${knowledgeData.length}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">学科数</span>
      <span class="stat-value">${Object.keys(subjects).length}</span>
    </div>
    ${Object.entries(stages).map(([stage, count]) => `
      <div class="stat-row">
        <span class="stat-label">${stage}</span>
        <span class="stat-value" style="color: ${STAGE_COLORS[stage] || '#888'}">${count}</span>
      </div>
    `).join('')}
  `;
}

// ===== 工具 =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
