/* ══════════════════════════════════════════════════════════════
   Green Scholarship Analytics — Dashboard JavaScript
   All chart rendering, API integration, filter logic
══════════════════════════════════════════════════════════════ */

'use strict';

// ─── Chart.js Global Defaults ─────────────────────────────────
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = '#3A5C3C';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(27,94,32,0.92)';
Chart.defaults.plugins.tooltip.titleColor = '#fff';
Chart.defaults.plugins.tooltip.bodyColor = '#C8E6C9';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.animation.duration = 700;
Chart.defaults.animation.easing = 'easeInOutQuart';

// ─── Color Palettes (Vibrant & Distinct) ─────────────────────
const COLORS = {
  vibrant: [
    '#2E7D32', '#0288D1', '#ED6C02', '#9C27B0', '#D32F2F', 
    '#00897B', '#FBC02D', '#5C6BC0', '#8D6E63', '#43A047'
  ],
  gender: ['#0277BD', '#E65100', '#1B5E20'],
  donut: ['#2E7D32', '#0288D1', '#ED6C02', '#9C27B0', '#D32F2F', '#00897B'],
  mixed: ['#1B5E20', '#0277BD', '#558B2F', '#BF360C', '#4527A0', '#00695C', '#E65100', '#01579B', '#880E4F', '#33691E'],
  green: ['#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9']
};

// ─── State ────────────────────────────────────────────────────
let currentPage = 'overview';
let currentStudentPage = 1;
const charts = {};
let debounceTimer = null;

// ─── Utility: format numbers ──────────────────────────────────
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN');
}

function animateCounter(el, target, isFloat = false) {
  if (!el) return;
  const num = Number(target) || 0;
  if (isFloat) {
    el.textContent = num.toFixed(2);
    return;
  }
  const start = 0;
  const dur = 800;
  const startTime = performance.now();
  function step(now) {
    const elapsed = Math.min(1, (now - startTime) / dur);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    const val = start + (num - start) * eased;
    el.textContent = fmt(Math.round(val));
    if (elapsed < 1) requestAnimationFrame(step);
    else el.textContent = fmt(num);
  }
  requestAnimationFrame(step);
}

// ─── Build query string from active filters ───────────────────
function getFilterParams() {
  return new URLSearchParams({
    district:         document.getElementById('f-district').value,
    college:          document.getElementById('f-college').value,
    course:           document.getElementById('f-course').value,
    gender:           document.getElementById('f-gender').value,
    year:             document.getElementById('f-year').value,
    scholarship_type: document.getElementById('f-scholarship').value,
    eligibility:      document.getElementById('f-eligibility').value,
    nss_ncc:          document.getElementById('f-nss-ncc').value,
  }).toString();
}

// ─── Fetch wrapper ─────────────────────────────────────────────
async function apiFetch(endpoint) {
  const params = getFilterParams();
  const res = await fetch(`${endpoint}?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Destroy & recreate a chart ───────────────────────────────
function getChart(id, type, data, options = {}) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');
  const mergedOptions = Object.assign({
    responsive: true,
    maintainAspectRatio: false,
  }, options);
  charts[id] = new Chart(ctx, { type, data, options: mergedOptions });
  return charts[id];
}

// ═══════════════════════════════════════════
// FILTER OPTIONS LOAD
// ═══════════════════════════════════════════
async function loadFilterOptions() {
  try {
    const data = await fetch('/api/filter-options').then(r => r.json());

    const populate = (id, items, label) => {
      const el = document.getElementById(id);
      el.innerHTML = `<option value="">${label}</option>`;
      items.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        el.appendChild(opt);
      });
    };

    populate('f-district',    data.districts,    'All Districts');
    populate('f-college',     data.colleges,     'All Colleges');
    populate('f-course',      data.courses,      'All Courses');
    populate('f-gender',      data.genders,      'All Genders');
    populate('f-year',        data.years,        'All Years');
    populate('f-scholarship', data.scholarships, 'All Types');
    populate('f-eligibility', data.eligibility,  'All');
    populate('f-nss-ncc',     data.nss_ncc,      'All');
  } catch (e) {
    console.error('Filter options error:', e);
  }
}

// ═══════════════════════════════════════════
// KPI CARDS
// ═══════════════════════════════════════════
async function loadKPIs() {
  try {
    const d = await apiFetch('/api/kpis');
    const set = (id, val, isFloat = false) => {
      const el = document.getElementById(id);
      if (el) animateCounter(el, val, isFloat);
    };
    set('kpi-total',       d.total_students);
    set('kpi-eligible',    d.eligible_students);
    set('kpi-green-score', d.avg_green_score, true);
    set('kpi-percentage',  d.avg_percentage, true);
    set('kpi-trees',       d.trees_planted);
    set('kpi-vol-hours',   d.volunteer_hours);
    set('kpi-recycling',   d.recycling_drives);
    set('kpi-water',       d.water_conservation);
    set('kpi-campus',      d.campus_cleaning);
    set('kpi-energy',      d.energy_campaigns);
  } catch (e) {
    console.error('KPI error:', e);
  }
}

// ═══════════════════════════════════════════
// OVERVIEW PAGE CHARTS
// ═══════════════════════════════════════════
async function loadOverview() {
  try {
    const d = await apiFetch('/api/overview');

    // 1. Top 10 Colleges (Horizontal Bar Chart)
    getChart('chart-top-colleges', 'bar', {
      labels: d.top_colleges.map(r => r.COLLEGE),
      datasets: [{
        label: 'Eligible Students',
        data: d.top_colleges.map(r => r.CNT),
        backgroundColor: '#1B5E20', // Green for eligible
        borderRadius: 6,
      }],
    }, {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: '#E8F5E9' } },
        y: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    });

    // 2. Gender Donut Chart
    getChart('chart-gender', 'doughnut', {
      labels: d.gender_dist.map(r => r.GENDER),
      datasets: [{ data: d.gender_dist.map(r => r.CNT), backgroundColor: ['#0277BD', '#E65100', '#1B5E20'], borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }],
    }, { plugins: { legend: { position: 'bottom' } }, cutout: '65%' });

    // 3. Scholarship Distribution by Type (Horizontal Bar Chart)
    getChart('chart-scholarship-dist', 'bar', {
      labels: d.scholarship_dist.map(r => r.SCHOLARSHIPTYPE),
      datasets: [{
        label: 'Number of Students',
        data: d.scholarship_dist.map(r => r.CNT),
        backgroundColor: ['#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50'],
        borderRadius: 5,
      }],
    }, {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: '#E8F5E9' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    });

    // 4. Total Students vs Eligible Students by Year
    getChart('chart-year-trend', 'bar', {
      labels: d.year_trend.map(r => r.YEAR),
      datasets: [
        {
          type: 'line',
          label: 'Eligibility Rate (%)',
          data: d.year_trend.map(r => (r.TOTAL > 0 ? (r.ELIGIBLE/r.TOTAL)*100 : 0).toFixed(1)),
          borderColor: '#0277BD',
          backgroundColor: '#0277BD',
          borderWidth: 2,
          yAxisID: 'y1',
          tension: 0.3,
          pointRadius: 4
        },
        {
          type: 'bar',
          label: 'Total Students',
          data: d.year_trend.map(r => r.TOTAL),
          backgroundColor: '#A5D6A7', // Light Green
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: 'Eligible Students',
          data: d.year_trend.map(r => r.ELIGIBLE),
          backgroundColor: '#1B5E20', // Dark Green
          borderRadius: 4,
          yAxisID: 'y'
        }
      ],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: { 
        y: { type: 'linear', display: true, position: 'left', beginAtZero: true, grid: { color: '#E8F5E9' } }, 
        y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: 100, grid: { drawOnChartArea: false } },
        x: { grid: { display: false } } 
      },
    });

    // 5. Eligibility Doughnut Chart
    getChart('chart-eligibility', 'doughnut', {
      labels: d.eligibility_dist.map(r => r.ELIGIBILITY),
      datasets: [{ data: d.eligibility_dist.map(r => r.CNT), backgroundColor: ['#D32F2F', '#2E7D32'], borderWidth: 2, borderColor: '#fff' }],
    }, { plugins: { legend: { position: 'bottom' } }, cutout: '60%' });

    // 6. Green Score Distribution (Bar Chart)
    if (d.green_score_dist) {
      getChart('chart-green-score-dist', 'bar', {
        labels: d.green_score_dist.map(r => r.RANGE),
        datasets: [{
          label: 'Student Count',
          data: d.green_score_dist.map(r => r.CNT),
          backgroundColor: '#E65100', // Orange for environmental
          borderRadius: 5,
        }],
      }, {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#E8F5E9' } },
          x: { grid: { display: false } },
        },
      });
    }

    // 7. Environmental Activities Stacked Bar Chart
    getChart('chart-env-activities', 'bar', {
      labels: d.env_activities.map(r => r.DISTRICT),
      datasets: [
        { label: 'Trees Planted', data: d.env_activities.map(r => r.TREES), backgroundColor: '#1B5E20', borderRadius: 4 },
        { label: 'Volunteer Hours', data: d.env_activities.map(r => r.VOL_HOURS), backgroundColor: '#0277BD', borderRadius: 4 },
        { label: 'Recycling Drives', data: d.env_activities.map(r => r.RECYCLING), backgroundColor: '#ED6C02', borderRadius: 4 },
      ],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: '#E8F5E9' } },
      },
    });

    // 7. Top Eco-Friendly Colleges Radar Chart
    getChart('chart-eco-colleges', 'radar', {
      labels: d.eco_colleges.map(r => r.COLLEGE),
      datasets: [{
        label: 'Avg Green Score',
        data: d.eco_colleges.map(r => r.AVG_SCORE),
        backgroundColor: 'rgba(46,125,50,0.25)',
        borderColor: '#2E7D32',
        borderWidth: 2,
        pointBackgroundColor: '#ED6C02',
        pointRadius: 5,
      }],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: { r: { beginAtZero: false, grid: { color: '#C8E6C9' } } }
    });

    // 8. District Distribution Bar Chart
    getChart('chart-district-bar', 'bar', {
      labels: d.district_dist.map(r => r.DISTRICT),
      datasets: [{
        label: 'Total Students',
        data: d.district_dist.map(r => r.CNT),
        backgroundColor: '#E65100', // Orange for environmental
        borderRadius: 5,
      }],
    }, {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#E8F5E9' } },
        x: { grid: { display: false }, ticks: { maxRotation: 35, font: { size: 10 } } },
      },
    });

    // Populate Key Insights
    if (d.key_insights) {
      const eligRate = document.getElementById('insight-elig-rate');
      if (eligRate) eligRate.textContent = d.key_insights.eligibility_rate + '%';
      
      const topDist = document.getElementById('insight-top-district');
      if (topDist) topDist.textContent = d.key_insights.top_district;
      
      const topCollege = document.getElementById('insight-top-college');
      if (topCollege) topCollege.textContent = d.key_insights.top_college;
      
      const envLeader = document.getElementById('insight-env-leader');
      if (envLeader) envLeader.textContent = d.key_insights.env_leader;
    }
  } catch (e) {
    console.error('Overview load error:', e);
    throw e;
  }
}

// ═══════════════════════════════════════════
// ACADEMIC PAGE CHARTS
// ═══════════════════════════════════════════
async function loadAcademic() {
  try {
    const d = await apiFetch('/api/academic');

    // College Performance Multi-Axis Combo / Bar Chart
    getChart('chart-college-perf', 'bar', {
      labels: d.college_perf.map(r => r.COLLEGE),
      datasets: [
        { label: 'Avg Percentage (%)', data: d.college_perf.map(r => r.AVG_PCT), backgroundColor: '#0277BD', borderRadius: 4 },
        { label: 'Avg Green Score', data: d.college_perf.map(r => r.AVG_SCORE), backgroundColor: '#1B5E20', borderRadius: 4 },
      ],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#E8F5E9' } },
        x: { grid: { display: false }, ticks: { maxRotation: 35, font: { size: 10 } } },
      },
    });

    // Course Horizontal Bar
    getChart('chart-course-perf', 'bar', {
      labels: d.course_perf.map(r => r.COURSE),
      datasets: [{
        label: 'Avg Percentage',
        data: d.course_perf.map(r => r.AVG_PCT),
        backgroundColor: '#0277BD', // Blue for academic
        borderRadius: 4,
      }],
    }, {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: { color: '#E8F5E9' } }, y: { grid: { display: false } } },
    });

    // Gender Donut Chart
    getChart('chart-gender-perf', 'doughnut', {
      labels: d.gender_perf.map(r => r.GENDER + ' (Avg ' + r.AVG_PCT + '%)'),
      datasets: [{
        data: d.gender_perf.map(r => r.AVG_PCT),
        backgroundColor: ['#0277BD', '#E65100', '#1B5E20'],
        borderWidth: 2, borderColor: '#fff', hoverOffset: 8,
      }],
    }, { plugins: { legend: { position: 'bottom' } }, cutout: '60%' });

    // Year-wise Stepped / Smooth Line Chart
    getChart('chart-year-perf', 'line', {
      labels: d.year_perf.map(r => r.YEAR),
      datasets: [
        { label: 'Avg Percentage', data: d.year_perf.map(r => r.AVG_PCT), borderColor: '#0277BD', backgroundColor: 'rgba(2,119,189,0.15)', fill: true, tension: 0.3, borderWidth: 3, pointRadius: 6 },
        { label: 'Avg Green Score', data: d.year_perf.map(r => r.AVG_SCORE), borderColor: '#E65100', backgroundColor: 'rgba(230,81,0,0.15)', fill: true, tension: 0.3, borderWidth: 3, pointRadius: 6 },
      ],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: false, grid: { color: '#E8F5E9' } }, x: { grid: { display: false } } },
    });

  } catch (e) {
    console.error('Academic load error:', e);
    throw e;
  }
}

// ═══════════════════════════════════════════
// ENVIRONMENTAL PAGE CHARTS
// ═══════════════════════════════════════════
async function loadEnvironmental() {
  try {
    const d = await apiFetch('/api/environmental');

    // District Environment Stacked Bar
    getChart('chart-district-env', 'bar', {
      labels: d.district_env.map(r => r.DISTRICT),
      datasets: [
        { label: 'Trees Planted',             data: d.district_env.map(r => r.TREES),    backgroundColor: '#1B5E20', borderRadius: 4 },
        { label: 'Volunteer Hours',            data: d.district_env.map(r => r.VOL_HOURS),backgroundColor: '#0277BD', borderRadius: 4 },
        { label: 'Recycling Drives',           data: d.district_env.map(r => r.RECYCLING),backgroundColor: '#ED6C02', borderRadius: 4 },
        { label: 'Water Conservation',         data: d.district_env.map(r => r.WATER),    backgroundColor: '#F57C00', borderRadius: 4 },
        { label: 'Campus Cleaning',            data: d.district_env.map(r => r.CAMPUS),   backgroundColor: '#FF9800', borderRadius: 4 },
        { label: 'Energy Campaigns',           data: d.district_env.map(r => r.ENERGY),   backgroundColor: '#FFB74D', borderRadius: 4 },
      ],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 35 } },
        y: { stacked: true, beginAtZero: true, grid: { color: '#E8F5E9' } },
      },
    });

    // Top Contributors Horizontal Bar
    getChart('chart-top-contributors', 'bar', {
      labels: d.top_contributors.map(r => r.COLLEGE_NAME),
      datasets: [{
        label: 'Total Environmental Activities',
        data: d.top_contributors.map(r => r.TOTAL_ACTIVITY),
        backgroundColor: '#E65100', // Orange for environmental
        borderRadius: 5,
      }],
    }, {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: { color: '#E8F5E9' } }, y: { grid: { display: false } } },
    });

    // Avg Green Score Radar Chart
    getChart('chart-district-score', 'radar', {
      labels: d.district_env.map(r => r.DISTRICT),
      datasets: [{
        label: 'Avg Green Score',
        data: d.district_env.map(r => r.AVG_SCORE),
        backgroundColor: 'rgba(2,136,209,0.25)',
        borderColor: '#0288D1',
        borderWidth: 2,
        pointBackgroundColor: '#ED6C02',
        pointRadius: 5,
      }],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: { r: { beginAtZero: false, grid: { color: '#E8F5E9' } } }
    });

  } catch (e) {
    console.error('Environmental load error:', e);
    throw e;
  }
}

// ═══════════════════════════════════════════
// SCHOLARSHIP PAGE CHARTS
// ═══════════════════════════════════════════
async function loadScholarship() {
  try {
    const d = await apiFetch('/api/scholarship');

    // Grouped Bar Chart
    getChart('chart-scholarship-type', 'bar', {
      labels: d.scholarship_type.map(r => r.SCHOLARSHIPTYPE),
      datasets: [
        { label: 'Total Students', data: d.scholarship_type.map(r => r.TOTAL), backgroundColor: '#0277BD', borderRadius: 4 },
        { label: 'Eligible',       data: d.scholarship_type.map(r => r.ELIGIBLE), backgroundColor: '#1B5E20', borderRadius: 4 },
      ],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, grid: { color: '#E8F5E9' } }, x: { grid: { display: false } } },
    });

    // District Eligibility Horizontal Stacked
    getChart('chart-district-elig', 'bar', {
      labels: d.district_eligibility.map(r => r.DISTRICT),
      datasets: [
        { label: 'Total', data: d.district_eligibility.map(r => r.TOTAL), backgroundColor: '#A5D6A7', borderRadius: 4 },
        { label: 'Eligible', data: d.district_eligibility.map(r => r.ELIGIBLE), backgroundColor: '#1B5E20', borderRadius: 4 },
      ],
    }, {
      indexAxis: 'y',
      plugins: { legend: { position: 'top' } },
      scales: { x: { beginAtZero: true, grid: { color: '#E8F5E9' } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } },
    });

    // Polar Area Chart for Eligibility Rate
    const rates = d.scholarship_type.map(r => r.TOTAL > 0 ? ((r.ELIGIBLE / r.TOTAL) * 100).toFixed(1) : 0);
    getChart('chart-elig-rate', 'polarArea', {
      labels: d.scholarship_type.map(r => r.SCHOLARSHIPTYPE),
      datasets: [{
        data: rates,
        backgroundColor: ['rgba(27,94,32,0.8)', 'rgba(46,125,50,0.8)', 'rgba(56,142,60,0.8)', 'rgba(67,160,71,0.8)', 'rgba(76,175,80,0.8)'],
      }],
    }, {
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw}% eligible`,
          },
        },
      },
    });

    // College Eligibility horizontal
    getChart('chart-college-elig', 'bar', {
      labels: d.college_eligibility.map(r => r.COLLEGE),
      datasets: [
        { label: 'Total Students', data: d.college_eligibility.map(r => r.TOTAL), backgroundColor: '#C8E6C9', borderRadius: 4 },
        { label: 'Eligible', data: d.college_eligibility.map(r => r.ELIGIBLE), backgroundColor: '#1B5E20', borderRadius: 4 },
      ],
    }, {
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 35, font: { size: 10 } } },
        y: { beginAtZero: true, grid: { color: '#E8F5E9' } },
      },
    });

  } catch (e) {
    console.error('Scholarship load error:', e);
    throw e;
  }
}

// ═══════════════════════════════════════════
// DYNAMIC FIELDS STATE & HELPERS
// ═══════════════════════════════════════════
let allAvailableFields = [];
let selectedFields = [];
let currentStudentsData = [];
let currentPageSize = 50;

// Default column set to show initially
const DEFAULT_FIELDS = [
  'STUDENTID', 'STUDENTNAME', 'COLLEGE', 'COURSE', 'DISTRICT', 
  'GREENSCORE', 'PERCENTAGE', 'ELIGIBILITY', 'SCHOLARSHIPTYPE'
];

// User-friendly column display labels
const FIELD_LABELS = {
  'STUDENTID': 'Student ID',
  'STUDENTNAME': 'Student Name',
  'GENDER': 'Gender',
  'DOB': 'Date of Birth',
  'EMAIL': 'Email Address',
  'PHONE': 'Phone Number',
  'COLLEGE': 'College / University',
  'COURSE': 'Course / Branch',
  'YEAR': 'Academic Year',
  'DISTRICT': 'District',
  'STATE': 'State',
  'FAMILYINCOME': 'Family Income (₹)',
  'PERCENTAGE': 'Academic Percentage (%)',
  'TREESPLANTED': 'Trees Planted',
  'GREENACTIVITIES': 'Green Activities',
  'NSS_NCC_PARTICIPATION': 'NSS/NCC Participation',
  'NSS_NCC_HOURS': 'NSS/NCC Hours',
  'VOLUNTEERHOURS': 'Volunteer Hours',
  'RECYCLINGDRIVES': 'Recycling Drives',
  'CAMPUSCLEANINGDRIVES': 'Campus Cleaning Drives',
  'WATERCONSERVATIONACTIVITIES': 'Water Conservation Activities',
  'ENERGYSAVINGCAMPAIGNS': 'Energy Saving Campaigns',
  'GREENSCORE': 'Green Score',
  'SCHOLARSHIPTYPE': 'Scholarship Type',
  'APPLICATIONDATE': 'Application Date',
  'STATUS': 'Application Status',
  'ELIGIBILITY': 'Eligibility'
};

function getFieldLabel(key) {
  return FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ─── Field Selector Panel Controls ───────────────────────────
function toggleFieldSelector() {
  const panel = document.getElementById('fieldSelectorPanel');
  if (panel) panel.classList.toggle('open');
}

// Close panel on outside click
document.addEventListener('click', (e) => {
  const dropdown = document.querySelector('.field-selector-dropdown');
  const panel = document.getElementById('fieldSelectorPanel');
  if (panel && dropdown && !dropdown.contains(e.target)) {
    panel.classList.remove('open');
  }
});

function initFieldSelector(columns) {
  allAvailableFields = columns || [];
  if (!selectedFields.length) {
    // Select default fields that exist in returned columns
    selectedFields = DEFAULT_FIELDS.filter(f => allAvailableFields.includes(f));
    if (!selectedFields.length) selectedFields = allAvailableFields.slice(0, 8);
  }
  renderFieldCheckboxList();
}

function renderFieldCheckboxList() {
  const container = document.getElementById('fieldCheckboxList');
  const search = (document.getElementById('fieldSearchInput')?.value || '').toLowerCase();
  const badge = document.getElementById('selectedFieldCount');
  
  if (badge) badge.textContent = selectedFields.length;
  if (!container) return;

  const filtered = allAvailableFields.filter(f => 
    getFieldLabel(f).toLowerCase().includes(search) || f.toLowerCase().includes(search)
  );

  container.innerHTML = filtered.map(field => {
    const isChecked = selectedFields.includes(field);
    return `
      <label class="field-checkbox-item">
        <input type="checkbox" value="${field}" ${isChecked ? 'checked' : ''} onchange="toggleFieldSelection('${field}')" />
        <span>${getFieldLabel(field)}</span>
      </label>
    `;
  }).join('');
}

function filterFieldSelectorList() {
  renderFieldCheckboxList();
}

function toggleFieldSelection(field) {
  if (selectedFields.includes(field)) {
    if (selectedFields.length === 1) {
      alert('At least one field must remain selected.');
      renderFieldCheckboxList();
      return;
    }
    selectedFields = selectedFields.filter(f => f !== field);
  } else {
    selectedFields.push(field);
  }
  renderFieldCheckboxList();
  renderStudentTable();
}

function selectAllFields(select) {
  if (select) {
    selectedFields = [...allAvailableFields];
  } else {
    selectedFields = allAvailableFields.slice(0, 1);
  }
  renderFieldCheckboxList();
  renderStudentTable();
}

function resetDefaultFields() {
  selectedFields = DEFAULT_FIELDS.filter(f => allAvailableFields.includes(f));
  renderFieldCheckboxList();
  renderStudentTable();
}

function changePageSize(size) {
  currentPageSize = parseInt(size, 10) || 50;
  loadStudents(1);
}

// ═══════════════════════════════════════════
// STUDENT DETAILS TABLE
// ═══════════════════════════════════════════
async function loadStudents(page = 1) {
  currentStudentPage = page;
  const thead = document.getElementById('studentTableHead');
  const tbody = document.getElementById('studentTableBody');

  if (tbody) {
    const colSpan = Math.max(selectedFields.length, 1);
    tbody.innerHTML = `<tr><td colspan="${colSpan}" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading from Snowflake…</td></tr>`;
  }

  try {
    const searchVal = document.getElementById('studentSearch')?.value || '';
    const params = getFilterParams() +
      `&page=${page}&pageSize=${currentPageSize}&search=${encodeURIComponent(searchVal)}`;
    const res = await fetch(`/api/students?${params}`);
    const d   = await res.json();

    if (!res.ok || !d.success) throw new Error(d.error || 'Failed to fetch students');

    const total = d.total_records || d.count || 0;
    currentStudentsData = d.data || [];

    // Initialize field selector with dynamic columns from Snowflake
    if (d.columns && d.columns.length) {
      initFieldSelector(d.columns);
    }

    document.getElementById('recordCount').textContent =
      `Showing ${total > 0 ? (page - 1) * currentPageSize + 1 : 0}–${Math.min(page * currentPageSize, total)} of ${total.toLocaleString()} students`;

    renderStudentTable(total);
    buildPagination(total, page, currentPageSize);

  } catch (e) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="loading-row" style="color:red">Error loading Snowflake data.</td></tr>`;
    console.error('Students load error:', e);
    throw e;
  }
}

function renderStudentTable(totalRecords = null) {
  const thead = document.getElementById('studentTableHead');
  const tbody = document.getElementById('studentTableBody');
  if (!thead || !tbody) return;

  if (!currentStudentsData || !currentStudentsData.length) {
    thead.innerHTML = `<tr>${selectedFields.map(f => `<th>${getFieldLabel(f)}</th>`).join('')}</tr>`;
    tbody.innerHTML = `<tr><td colspan="${selectedFields.length}" class="loading-row">No students match your filters.</td></tr>`;
    return;
  }

  // Build Dynamic Table Headers
  thead.innerHTML = `
    <tr>
      ${selectedFields.map(f => `<th>${getFieldLabel(f)}</th>`).join('')}
    </tr>
  `;

  // Build Dynamic Table Rows
  tbody.innerHTML = currentStudentsData.map((r, idx) => `
    <tr onclick="openStudentModal(${idx})" title="Click to view full student profile">
      ${selectedFields.map(field => formatCellContent(field, r[field])).join('')}
    </tr>
  `).join('');
}

function formatCellContent(field, val) {
  if (val === null || val === undefined || val === '') return `<td>—</td>`;

  if (field === 'STUDENTID') {
    return `<td><code>${val}</code></td>`;
  }
  if (field === 'STUDENTNAME') {
    return `<td><strong>${val}</strong></td>`;
  }
  if (field === 'ELIGIBILITY') {
    const isEligible = String(val).toLowerCase() === 'eligible';
    return `<td><span class="badge ${isEligible ? 'badge-eligible' : 'badge-ineligible'}">${val}</span></td>`;
  }
  if (field === 'PERCENTAGE') {
    return `<td>${val}%</td>`;
  }
  if (field === 'GREENSCORE') {
    return `<td><strong style="color:#1B5E20">${val}</strong></td>`;
  }
  if (field === 'FAMILYINCOME') {
    return `<td>₹${Number(val).toLocaleString('en-IN')}</td>`;
  }

  return `<td>${val}</td>`;
}

function buildPagination(total, current, perPage) {
  const totalPages = Math.ceil(total / perPage);
  const el = document.getElementById('tablePagination');
  if (!el) return;
  const pages = [];

  pages.push(`<button class="page-btn" onclick="loadStudents(${current - 1})" ${current <= 1 ? 'disabled' : ''}>
    <i class="fas fa-chevron-left"></i> Previous</button>`);

  const range = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 2 && i <= current + 2)) range.push(i);
    else if (range[range.length - 1] !== '...') range.push('...');
  }

  range.forEach(p => {
    if (p === '...') {
      pages.push(`<span style="padding:0 4px;color:#7A9B7C">…</span>`);
    } else {
      pages.push(`<button class="page-btn ${p === current ? 'active' : ''}" onclick="loadStudents(${p})">${p}</button>`);
    }
  });

  pages.push(`<button class="page-btn" onclick="loadStudents(${current + 1})" ${current >= totalPages ? 'disabled' : ''}>
    Next <i class="fas fa-chevron-right"></i></button>`);

  el.innerHTML = pages.join('');
}

// ═══════════════════════════════════════════
// PAGE NAVIGATION & SWITCHING
// ═══════════════════════════════════════════

function setSectionState(section, state, errorMsg = '') {
  if (!section) return;
  section.querySelectorAll('.section-overlay').forEach(el => el.remove());
  if (state === 'loading') {
    section.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.className = 'section-overlay loading';
    overlay.style.cssText = 'position:absolute; inset:0; background:rgba(255,255,255,0.7); z-index:50; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:14px; color:#2E7D32; backdrop-filter:blur(2px);';
    overlay.innerHTML = '<i class="fas fa-circle-notch fa-spin fa-3x" style="margin-bottom:1rem;"></i><h3 style="margin:0;font-weight:600;">Loading data...</h3>';
    section.appendChild(overlay);
  } else if (state === 'error') {
    section.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.className = 'section-overlay error';
    overlay.style.cssText = 'position:absolute; inset:0; background:rgba(255,255,255,0.95); z-index:50; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:14px; color:#D32F2F; text-align:center; padding:2rem; backdrop-filter:blur(4px);';
    overlay.innerHTML = '<i class="fas fa-exclamation-circle fa-3x" style="margin-bottom:1rem;"></i><h3 style="margin-bottom:0.5rem;font-weight:700;">Failed to load data</h3><p style="color:#555; max-width:400px; line-height:1.5; margin-bottom:1.5rem;">' + (errorMsg || 'A network or server error occurred.') + '</p><button onclick="showPage(\'' + currentPage + '\')" style="padding: 10px 24px; background:#D32F2F; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer; font-size:1rem; box-shadow:0 4px 12px rgba(211,47,47,0.3); transition:all 0.2s;"><i class="fas fa-rotate-right"></i> Try Again</button>';
    section.appendChild(overlay);
  }
}

function showPage(page) {
  currentPage = page;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const activeNavBtn = document.getElementById(`nav-${page}`);
  if (activeNavBtn) activeNavBtn.classList.add('active');

  // Update page sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const activePageSec = document.getElementById(`page-${page}`);
  if (activePageSec) activePageSec.classList.add('active');

  // Update topbar title
  const titles = {
    overview:      'Dashboard Overview',
    academic:      'Academic Analysis',
    environmental: 'Environmental Analysis',
    scholarship:   'Scholarship Analysis',
    students:      'Student Details',
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[page] || '';

  // Load page data
  const loaders = {
    overview:      loadOverview,
    academic:      loadAcademic,
    environmental: loadEnvironmental,
    scholarship:   loadScholarship,
    students:      () => loadStudents(1),
  };
  if (loaders[page]) {
    setSectionState(activePageSec, 'loading');
    Promise.resolve(loaders[page]())
      .then(() => setSectionState(activePageSec, 'ready'))
      .catch(err => {
        console.error('Page load error:', err);
        setSectionState(activePageSec, 'error', err.message);
      });
  }
}

// ═══════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════
function toggleFilters() {
  const filterPanel = document.getElementById('filterPanel');
  if (filterPanel) filterPanel.classList.toggle('open');
}

function applyFilters() {
  loadKPIs();
  showPage(currentPage);
}

function resetFilters() {
  ['f-district','f-college','f-course','f-gender','f-year','f-scholarship','f-eligibility','f-nss-ncc']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  applyFilters();
}

// ═══════════════════════════════════════════
// SEARCH DEBOUNCE
// ═══════════════════════════════════════════
function debounceStudentLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadStudents(1), 420);
}

// ═══════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════
function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('topbarTime');
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ═══════════════════════════════════════════
// STUDENT DETAILED PROFILE MODAL
// ═══════════════════════════════════════════
function openStudentModal(index) {
  const student = currentStudentsData[index];
  if (!student) return;

  const overlay = document.getElementById('studentModalOverlay');
  const nameEl  = document.getElementById('modalStudentName');
  const idEl    = document.getElementById('modalStudentId');
  const bodyEl  = document.getElementById('modalStudentDetails');

  if (nameEl) nameEl.textContent = student.STUDENTNAME || 'Student Profile';
  if (idEl)   idEl.textContent   = `Student ID: ${student.STUDENTID || '—'}`;

  // Categorize fields dynamically into logical groups
  const groups = {
    'Student Information': ['STUDENTID', 'STUDENTNAME', 'GENDER', 'DOB', 'EMAIL', 'PHONE', 'COLLEGE', 'COURSE', 'YEAR', 'DISTRICT', 'STATE'],
    'Academic & Eligibility': ['PERCENTAGE', 'GREENSCORE', 'SCHOLARSHIPTYPE', 'ELIGIBILITY', 'STATUS', 'APPLICATIONDATE'],
    'Environmental Activities': ['TREESPLANTED', 'GREENACTIVITIES', 'NSS_NCC_PARTICIPATION', 'NSS_NCC_HOURS', 'VOLUNTEERHOURS', 'RECYCLINGDRIVES', 'CAMPUSCLEANINGDRIVES', 'WATERCONSERVATIONACTIVITIES', 'ENERGYSAVINGCAMPAIGNS'],
    'Financial Information': ['FAMILYINCOME']
  };

  const icons = {
    'Student Information': 'fa-id-card',
    'Academic & Eligibility': 'fa-graduation-cap',
    'Environmental Activities': 'fa-leaf',
    'Financial Information': 'fa-wallet',
    'Additional Information': 'fa-circle-info'
  };

  const processedKeys = new Set();
  let sectionsHTML = '';

  // Render predefined grouped categories
  Object.keys(groups).forEach(groupName => {
    const keys = groups[groupName].filter(k => k in student);
    if (!keys.length) return;

    keys.forEach(k => processedKeys.add(k));

    sectionsHTML += `
      <div class="modal-section">
        <div class="modal-section-title">
          <i class="fas ${icons[groupName] || 'fa-folder'}"></i> ${groupName}
        </div>
        <div class="modal-grid">
          ${keys.map(k => `
            <div class="modal-field-item">
              <span class="modal-field-label">${getFieldLabel(k)}</span>
              <span class="modal-field-value">${formatModalValue(k, student[k])}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  // Collect any remaining dynamic fields not in groups
  const remainingKeys = Object.keys(student).filter(k => !processedKeys.has(k));
  if (remainingKeys.length) {
    sectionsHTML += `
      <div class="modal-section">
        <div class="modal-section-title">
          <i class="fas fa-circle-info"></i> Additional Information
        </div>
        <div class="modal-grid">
          ${remainingKeys.map(k => `
            <div class="modal-field-item">
              <span class="modal-field-label">${getFieldLabel(k)}</span>
              <span class="modal-field-value">${formatModalValue(k, student[k])}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (bodyEl) bodyEl.innerHTML = sectionsHTML;
  if (overlay) overlay.classList.add('open');
}

function formatModalValue(key, val) {
  if (val === null || val === undefined || val === '') return '—';
  if (key === 'FAMILYINCOME') return `₹${Number(val).toLocaleString('en-IN')}`;
  if (key === 'PERCENTAGE') return `${val}%`;
  if (key === 'ELIGIBILITY') {
    const isEligible = String(val).toLowerCase() === 'eligible';
    return `<span class="badge ${isEligible ? 'badge-eligible' : 'badge-ineligible'}">${val}</span>`;
  }
  return val;
}

function closeStudentModal(e) {
  const overlay = document.getElementById('studentModalOverlay');
  if (overlay) overlay.classList.remove('open');
}

// Esc key listener for modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeStudentModal();
});

// ═══════════════════════════════════════════
// LIVE CONNECTION INDICATOR & TIMESTAMP
// ═══════════════════════════════════════════
async function checkSnowflakeConnection() {
  const dot  = document.querySelector('.connection-dot');
  const text = document.querySelector('.sidebar-footer-text');
  const badgeText = document.getElementById('snowflake-status-text');
  const badgeDot = document.getElementById('snowflake-status-dot');
  const lastUpdatedEl = document.getElementById('last-updated-text');

  const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  try {
    const res  = await fetch('/api/test-connection');
    const data = await res.json();
    if (data.success) {
      if (dot)  dot.style.background = '#69f0ae';
      if (text) text.innerHTML = `<i class="fas fa-database"></i>&nbsp;Live · Snowflake`;
      if (badgeText) badgeText.textContent = '🟢 Live • Snowflake';
      if (badgeDot) badgeDot.style.color = '#2E7D32';
      if (lastUpdatedEl) lastUpdatedEl.innerHTML = `<i class="fas fa-clock"></i> Last Updated: ${nowStr} | Source: Snowflake`;
    } else {
      if (dot)  dot.style.background = '#ff5252';
      if (text) text.innerHTML = `<i class="fas fa-database"></i>&nbsp;Snowflake Offline`;
      if (badgeText) badgeText.textContent = '🔴 Offline • Snowflake';
      if (badgeDot) badgeDot.style.color = '#D32F2F';
      if (lastUpdatedEl) lastUpdatedEl.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#D32F2F;"></i> Database Offline`;
    }
  } catch (e) {
    if (dot)  dot.style.background = '#ff5252';
    if (text) text.innerHTML = `<i class="fas fa-database"></i>&nbsp;Snowflake Offline`;
    if (badgeText) badgeText.textContent = '🔴 Offline • Snowflake';
    if (badgeDot) badgeDot.style.color = '#D32F2F';
    if (lastUpdatedEl) lastUpdatedEl.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#D32F2F;"></i> Database Offline`;
  }
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
async function init() {
  const overlay = document.getElementById('loaderOverlay');
  try {
    checkSnowflakeConnection();
    await loadFilterOptions();
    await loadKPIs();
    await loadOverview();
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => overlay.remove(), 500);
    }
  } catch (e) {
    if (overlay) {
      overlay.querySelector('p').textContent = 'Error connecting to Snowflake. Check backend logs.';
      overlay.querySelector('p').style.color = '#B71C1C';
    }
    console.error('Init error:', e);
  }
}

document.addEventListener('DOMContentLoaded', init);
