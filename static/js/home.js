/* ═══════════════════════════════════════════════════════
   GREEN SCHOLARSHIP — HOME PAGE JS
   Fetches live Snowflake aggregations from Flask REST API
═══════════════════════════════════════════════════════ */

'use strict';

function animateCounter(element, targetValue, duration = 1600, suffix = '') {
  if (!element) return;
  const start = performance.now();
  const isFloat = typeof targetValue === 'number' && !Number.isInteger(targetValue);

  function format(n) {
    if (isFloat) return n.toFixed(1) + suffix;
    return n.toLocaleString('en-IN') + suffix;
  }

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = isFloat ? (easeOut * targetValue) : Math.round(easeOut * targetValue);
    element.textContent = format(current);
    if (progress < 1) requestAnimationFrame(step);
    else element.textContent = format(targetValue);
  }

  requestAnimationFrame(step);
}

async function loadHomeLiveData() {
  const loadingEl = document.getElementById('stats-loading');
  const gridEl    = document.getElementById('stats-grid');
  const errorEl   = document.getElementById('stats-error');

  try {
    const res  = await fetch('/api/kpis');
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to retrieve live Snowflake statistics');
    }

    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl)    gridEl.style.display    = 'grid';

    // Set Live Impact Metrics
    animateCounter(document.getElementById('stat-total-students'), data.total_students || 0);
    animateCounter(document.getElementById('stat-eligible-students'), data.eligible_students || 0);
    animateCounter(document.getElementById('stat-avg-green-score'), data.avg_green_score || 0);
    animateCounter(document.getElementById('stat-avg-percentage'), data.avg_percentage || 0, 1600, '%');
    animateCounter(document.getElementById('stat-trees'), data.trees_planted || 0);
    animateCounter(document.getElementById('stat-volunteer'), data.volunteer_hours || 0, 1600, ' hrs');
    animateCounter(document.getElementById('stat-recycling'), data.recycling_drives || 0);

    // Set Cumulative Environmental Metrics Section
    animateCounter(document.getElementById('env-trees'), data.trees_planted || 0);
    animateCounter(document.getElementById('env-volunteer'), data.volunteer_hours || 0, 1600, ' hrs');
    animateCounter(document.getElementById('env-recycling'), data.recycling_drives || 0);
    animateCounter(document.getElementById('env-water'), data.water_conservation || 0);
    animateCounter(document.getElementById('env-campus'), data.campus_cleaning || 0);
    animateCounter(document.getElementById('env-energy'), data.energy_campaigns || 0);

  } catch (err) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl)    gridEl.style.display    = 'none';
    if (errorEl)   errorEl.style.display   = 'block';
    console.error('Home statistics API error:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadHomeLiveData);
