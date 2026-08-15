/* ═══════════════════════════════════════════════════════
   GREEN SCHOLARSHIP PORTAL — JavaScript
   Covers: Splash, Login, Register, Forgot Password
   Version: 1.0 (Phase 1)
═══════════════════════════════════════════════════════ */

'use strict';

/* ─── Constants ─────────────────────────────────────── */
const API_BASE       = '';           // Same origin (Flask backend)
const SPLASH_DURATION = 2800;        // ms before auto-advancing

/* ─── Screen Management ─────────────────────────────── */
const Screens = {
  splash:   document.getElementById('screen-splash'),
  login:    document.getElementById('screen-login'),
  register: document.getElementById('screen-register'),

  /** Transition to a target screen by ID key */
  show(target) {
    const current = document.querySelector('.screen.active');
    const next    = this[target];
    if (!next || next === current) return;

    if (current) {
      current.classList.add('slide-out');
      setTimeout(() => {
        current.classList.remove('active', 'slide-out');
      }, 500);
    }

    // Small delay so slide-out starts first
    setTimeout(() => {
      next.classList.add('active');
      next.scrollTop = 0;
    }, 50);
  }
};

/* ─── Splash Screen ─────────────────────────────────── */
(function initSplash() {
  const progressBar = document.getElementById('splash-progress-bar');
  if (!progressBar) return;

  const start = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / SPLASH_DURATION * 100, 100);
    progressBar.style.width = `${progress}%`;

    if (elapsed < SPLASH_DURATION) {
      requestAnimationFrame(step);
    } else {
      Screens.show('login');
    }
  }

  requestAnimationFrame(step);
})();

/* ─── Helpers ───────────────────────────────────────── */

/** Toggle password field visibility */
function setupPasswordToggle(inputId, toggleId, iconId) {
  const input  = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  const icon   = document.getElementById(iconId);
  if (!input || !toggle || !icon) return;

  toggle.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type     = isHidden ? 'text' : 'password';
    icon.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
    toggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
}

/** Show an alert inside a container */
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  el.className = `auth-alert ${type} show`;

  const icon = document.createElement('i');
  icon.className = type === 'error'   ? 'fas fa-exclamation-circle'
                 : type === 'success' ? 'fas fa-check-circle'
                 :                      'fas fa-info-circle';

  const text = document.createTextNode(' ' + message);
  el.appendChild(icon);
  el.appendChild(text);

  if (type === 'success') {
    setTimeout(() => el.classList.remove('show'), 4000);
  }
}

/** Hide an alert */
function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.remove('show');
}

/** Mark a field as invalid */
function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('invalid');
  if (error) error.textContent = message;
  return false;
}

/** Clear a field's validation state */
function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) { input.classList.remove('invalid'); input.classList.add('valid'); }
  if (error) error.textContent = '';
}

/** Show loading state on a button */
function setButtonLoading(btnId, loaderId, isLoading) {
  const btn    = document.getElementById(btnId);
  const loader = document.getElementById(loaderId);
  if (!btn || !loader) return;

  const textSpan = btn.querySelector('.btn-text');
  btn.disabled = isLoading;

  if (isLoading) {
    if (textSpan) textSpan.style.display = 'none';
    loader.style.display = '';
  } else {
    if (textSpan) textSpan.style.display = '';
    loader.style.display = 'none';
  }
}

/** Simple email validation */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ─── Password Toggles ──────────────────────────────── */
setupPasswordToggle('login-password',          'login-pwd-toggle',          'login-pwd-icon');
setupPasswordToggle('reg-password',            'reg-pwd-toggle',            'reg-pwd-icon');
setupPasswordToggle('reg-confirm-password',    'reg-confirm-pwd-toggle',    'reg-confirm-pwd-icon');

/* ─── Password Strength Meter ───────────────────────── */
(function initPasswordStrength() {
  const pwInput      = document.getElementById('reg-password');
  const strengthBar  = document.getElementById('strength-bar');
  const strengthLbl  = document.getElementById('strength-label');
  if (!pwInput || !strengthBar || !strengthLbl) return;

  pwInput.addEventListener('input', () => {
    const val = pwInput.value;
    let score = 0;
    if (val.length >= 8)                     score++;
    if (/[A-Z]/.test(val))                   score++;
    if (/[0-9]/.test(val))                   score++;
    if (/[^A-Za-z0-9]/.test(val))            score++;

    const levels = [
      { pct: 0,    color: '#ccc',            label: '' },
      { pct: 25,   color: '#D32F2F',         label: 'Weak' },
      { pct: 50,   color: '#F57C00',         label: 'Fair' },
      { pct: 75,   color: '#0288D1',         label: 'Good' },
      { pct: 100,  color: '#2E7D32',         label: 'Strong' },
    ];

    const lv = levels[score];
    strengthBar.style.width     = `${lv.pct}%`;
    strengthBar.style.background = lv.color;
    strengthLbl.textContent     = lv.label ? `Password strength: ${lv.label}` : '';
    strengthLbl.style.color     = lv.color;
  });
})();

/* ─── Navigation between screens ───────────────────── */
const goToRegisterBtn = document.getElementById('go-to-register');
const goToLoginBtn    = document.getElementById('go-to-login');

if (goToRegisterBtn) {
  goToRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    Screens.show('register');
  });
}

if (goToLoginBtn) {
  goToLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    Screens.show('login');
  });
}

/* ─── Forgot Password Modal ─────────────────────────── */
const forgotModal     = document.getElementById('forgot-modal');
const forgotLink      = document.getElementById('forgot-password-link');
const modalCloseBtn   = document.getElementById('modal-close-btn');
const forgotSubmitBtn = document.getElementById('forgot-submit-btn');

if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (forgotModal) forgotModal.classList.add('show');
  });
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => {
    forgotModal.classList.remove('show');
    hideAlert('forgot-alert');
  });
}

if (forgotModal) {
  forgotModal.addEventListener('click', (e) => {
    if (e.target === forgotModal) {
      forgotModal.classList.remove('show');
    }
  });
}

if (forgotSubmitBtn) {
  forgotSubmitBtn.addEventListener('click', async () => {
    const emailInput = document.getElementById('forgot-email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !isValidEmail(email)) {
      showAlert('forgot-alert', 'Please enter a valid email address.', 'error');
      return;
    }

    forgotSubmitBtn.disabled = true;
    forgotSubmitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending…';

    // Simulate / call API
    await delay(1000);

    showAlert('forgot-alert', 'If this email is registered, a reset link has been sent.', 'success');
    forgotSubmitBtn.disabled = false;
    forgotSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
  });
}

/* ─── LOGIN FORM ────────────────────────────────────── */
const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('login-alert');

    const emailInput = document.getElementById('login-email');
    const pwInput    = document.getElementById('login-password');
    const email      = emailInput ? emailInput.value.trim() : '';
    const password   = pwInput    ? pwInput.value          : '';

    let valid = true;

    // Validate email
    if (!email) {
      setFieldError('login-email', 'login-email-error', 'Email or username is required.');
      valid = false;
    } else {
      clearFieldError('login-email', 'login-email-error');
    }

    // Validate password
    if (!password) {
      setFieldError('login-password', 'login-password-error', 'Password is required.');
      valid = false;
    } else if (password.length < 4) {
      setFieldError('login-password', 'login-password-error', 'Password must be at least 4 characters.');
      valid = false;
    } else {
      clearFieldError('login-password', 'login-password-error');
    }

    if (!valid) return;

    // Show loading
    setButtonLoading('login-btn', 'login-loader', true);

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert('login-alert', `Welcome back, ${data.name || 'Student'}! Redirecting…`, 'success');
        // Store minimal non-sensitive info in sessionStorage
        sessionStorage.setItem('gs_name', data.name || 'Student');
        sessionStorage.setItem('gs_logged_in', 'true');
        // Redirect after brief delay
        await delay(800);
        window.location.href = data.redirect || '/home';
      } else {
        showAlert('login-alert', data.message || 'Invalid email or password. Please try again.', 'error');
        setButtonLoading('login-btn', 'login-loader', false);
      }
    } catch (err) {
      showAlert('login-alert', 'Unable to connect to the server. Please check your connection.', 'error');
      setButtonLoading('login-btn', 'login-loader', false);
    }
  });

  // Clear errors on input
  loginForm.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid', 'valid');
    });
  });
}

/* ─── REGISTER FORM ─────────────────────────────────── */
const registerForm = document.getElementById('register-form');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('register-alert');

    const fields = {
      student_id:       document.getElementById('reg-student-id'),
      full_name:        document.getElementById('reg-name'),
      email:            document.getElementById('reg-email'),
      phone:            document.getElementById('reg-phone'),
      gender:           document.getElementById('reg-gender'),
      dob:              document.getElementById('reg-dob'),
      college:          document.getElementById('reg-college'),
      course:           document.getElementById('reg-course'),
      district:         document.getElementById('reg-district'),
      password:         document.getElementById('reg-password'),
      confirm_password: document.getElementById('reg-confirm-password'),
      terms:            document.getElementById('reg-terms'),
    };

    let valid = true;

    // Required field checks
    const requiredFields = [
      { id: 'reg-student-id',       errId: 'err-student-id',       label: 'Student ID' },
      { id: 'reg-name',             errId: 'err-name',             label: 'Full Name' },
      { id: 'reg-email',            errId: 'err-email',            label: 'Email' },
      { id: 'reg-phone',            errId: 'err-phone',            label: 'Phone Number' },
      { id: 'reg-gender',           errId: 'err-gender',           label: 'Gender' },
      { id: 'reg-dob',              errId: 'err-dob',              label: 'Date of Birth' },
      { id: 'reg-college',          errId: 'err-college',          label: 'College' },
      { id: 'reg-course',           errId: 'err-course',           label: 'Course' },
      { id: 'reg-district',         errId: 'err-district',         label: 'District' },
    ];

    requiredFields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el || !el.value.trim()) {
        setFieldError(f.id, f.errId, `${f.label} is required.`);
        valid = false;
      } else {
        clearFieldError(f.id, f.errId);
      }
    });

    // Email format
    if (fields.email && fields.email.value.trim() && !isValidEmail(fields.email.value)) {
      setFieldError('reg-email', 'err-email', 'Please enter a valid email address.');
      valid = false;
    }

    // Phone format (exact 10 digits)
    const phoneVal = fields.phone ? fields.phone.value.trim() : '';
    if (phoneVal && !/^\d{10}$/.test(phoneVal)) {
      setFieldError('reg-phone', 'err-phone', 'Phone number must be exactly 10 digits.');
      valid = false;
    }

    // Password validation
    const pw  = fields.password         ? fields.password.value         : '';
    const cpw = fields.confirm_password ? fields.confirm_password.value : '';

    if (!pw) {
      setFieldError('reg-password', 'err-password', 'Password is required.');
      valid = false;
    } else if (pw.length < 8) {
      setFieldError('reg-password', 'err-password', 'Password must be at least 8 characters.');
      valid = false;
    } else {
      clearFieldError('reg-password', 'err-password');
    }

    if (!cpw) {
      setFieldError('reg-confirm-password', 'err-confirm-password', 'Please confirm your password.');
      valid = false;
    } else if (pw && cpw !== pw) {
      setFieldError('reg-confirm-password', 'err-confirm-password', 'Passwords do not match.');
      valid = false;
    } else {
      clearFieldError('reg-confirm-password', 'err-confirm-password');
    }

    // Terms checkbox
    if (fields.terms && !fields.terms.checked) {
      document.getElementById('err-terms').textContent = 'You must agree to the Terms & Conditions.';
      valid = false;
    } else {
      const errTerms = document.getElementById('err-terms');
      if (errTerms) errTerms.textContent = '';
    }

    if (!valid) {
      showAlert('register-alert', 'Please fill in all required fields correctly.', 'error');
      // Scroll to first error
      const firstInvalid = registerForm.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Build payload
    const payload = {
      student_id:   fields.student_id?.value.trim(),
      full_name:    fields.full_name?.value.trim(),
      email:        fields.email?.value.trim(),
      phone:        fields.phone?.value.trim(),
      gender:       fields.gender?.value,
      dob:          fields.dob?.value,
      college:      fields.college?.value.trim(),
      course:       fields.course?.value.trim(),
      district:     fields.district?.value.trim(),
      password:     pw,
    };

    setButtonLoading('register-btn', 'register-loader', true);

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert('register-alert', 'Account created successfully! Redirecting to login…', 'success');
        await delay(1500);
        Screens.show('login');
        showAlert('login-alert', 'Account created! Please log in with your credentials.', 'success');
      } else {
        showAlert('register-alert', data.message || 'Registration failed. Please try again.', 'error');
      }
    } catch (err) {
      showAlert('register-alert', 'Unable to connect to the server. Please check your connection.', 'error');
    } finally {
      setButtonLoading('register-btn', 'register-loader', false);
    }
  });

  // Clear errors on input
  registerForm.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
    });
  });
}

/* ─── Phone Number Input Sanitizer (Numbers only, Max 10 digits) ─── */
(function initPhoneSanitizer() {
  const phoneInput = document.getElementById('reg-phone');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', (e) => {
    // Strip non-numeric characters
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }
    e.target.value = digits;
  });
})();

/* ─── Utility ───────────────────────────────────────── */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
