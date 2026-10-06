import { audioEngine } from './audio.js';
import { STONES } from './stonesData.js';

export function initRegistrationModule() {
  const modalRegister = document.getElementById('modal-register');
  const modalSuccess = document.getElementById('modal-success');
  const modalConfirm = document.getElementById('modal-confirm');
  const btnCloseRegister = document.getElementById('btn-close-register');
  const btnCloseSuccess = document.getElementById('btn-close-success');
  const btnCloseConfirm = document.getElementById('btn-close-confirm');
  const btnBackEdit = document.getElementById('btn-back-edit');
  const btnConfirmFinal = document.getElementById('btn-confirm-final');
  const confSubmitText = document.getElementById('conf-submit-text');
  const confSubmitSpinner = document.getElementById('conf-submit-spinner');
  const btnToggleConfPw = document.getElementById('btn-toggle-conf-pw');
  const confPassword = document.getElementById('conf-password');
  let pendingFormData = null;

  const btnNavRegister = document.getElementById('btn-nav-register');
  const btnWieldStone = document.getElementById('btn-wield-stone');
  const formReg = document.getElementById('form-registration');
  const regClosedNotice = document.getElementById('reg-closed-notice');
  let isRegistrationOpen = true;

  const regDomainBadge = document.getElementById('reg-domain-badge');
  const domainCards = document.querySelectorAll('.domain-radio-card');
  const sizeRadios = document.querySelectorAll('input[name="teamSize"]');
  const member4Card = document.getElementById('member-4-card');
  const m4Inputs = member4Card ? member4Card.querySelectorAll('input') : [];

  const qrImg = document.getElementById('qr-img');
  const qrAmountText = document.getElementById('qr-amount-text');
  const totalFeeDisplay = document.getElementById('total-fee-display');
  const regScreenshot = document.getElementById('reg-screenshot');
  const ocrBanner = document.getElementById('ocr-banner');
  const ocrBody = document.getElementById('ocr-body');
  const ocrIcon = document.getElementById('ocr-icon');
  const ocrTitle = document.getElementById('ocr-title');
  const regUtr = document.getElementById('reg-utr');
  const regPayPhone = document.getElementById('reg-pay-phone');
  const utrCheckBadge = document.getElementById('utr-check-badge');
  const regErrorMsg = document.getElementById('reg-error-msg');
  const btnSubmit = document.getElementById('btn-submit-registration');
  const regSpinner = document.getElementById('reg-spinner');

  let dynamicPaymentQrs = {
    member3: '/3mem.png',
    member4: '/4mem.png'
  };

  async function checkRegistrationStatus() {
    try {
      const res = await fetch('/api/registration-status');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.registrationOpen === 'boolean') {
          isRegistrationOpen = data.registrationOpen;
          applyRegistrationStatusUI(isRegistrationOpen);
        }
      }
    } catch (_) {}
  }

  function applyRegistrationStatusUI(isOpen) {
    if (!isOpen) {
      if (formReg) formReg.style.display = 'none';
      if (regClosedNotice) regClosedNotice.style.display = 'block';
      if (btnNavRegister) {
        btnNavRegister.innerHTML = '<span>🔒 REGISTRATION CLOSED</span>';
        btnNavRegister.classList.add('reg-nav-closed');
      }
      if (btnWieldStone) {
        btnWieldStone.innerHTML = '<span>🔒 REGISTRATIONS CLOSED</span>';
      }
    } else {
      if (formReg) formReg.style.display = 'block';
      if (regClosedNotice) regClosedNotice.style.display = 'none';
      if (btnNavRegister) {
        btnNavRegister.innerHTML = '<span class="btn-text"><span class="txt-desktop">✦ REGISTER SQUAD</span><span class="txt-mobile">✦ REGISTER</span></span>';
        btnNavRegister.classList.remove('reg-nav-closed');
      }
      if (btnWieldStone) {
        btnWieldStone.innerHTML = '<span class="wield-icon">✦</span><span class="wield-title">WIELD THIS STONE</span><svg class="wield-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      }
    }
  }

  checkRegistrationStatus();

  async function fetchDynamicPaymentQrs() {
    try {
      const res = await fetch('/api/payment-qrs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.paymentQrs) {
          if (data.paymentQrs.member3) dynamicPaymentQrs.member3 = data.paymentQrs.member3;
          if (data.paymentQrs.member4) dynamicPaymentQrs.member4 = data.paymentQrs.member4;
          const activeSizeRadio = document.querySelector('input[name="teamSize"]:checked');
          const currentSize = activeSizeRadio ? parseInt(activeSizeRadio.value, 10) : 3;
          if (qrImg) {
            qrImg.src = currentSize === 4 ? dynamicPaymentQrs.member4 : dynamicPaymentQrs.member3;
          }
        }
      }
    } catch (e) {
      // Graceful fallback to default /3mem.png and /4mem.png
    }
  }

  fetchDynamicPaymentQrs();

  let isReceiptVerified = false;
  let verifiedReceiptUtr = null;
  let isUtrUnique = false;
  let utrDebounceTimer = null;
  let isScanningReceipt = false;

  function isDummyUtr(utr) {
    if (!utr || typeof utr !== 'string') return true;
    const clean = utr.trim();
    if (/^(\d)\1+$/.test(clean)) return true; // 000000000000, 111111111111
    const dummies = ['123456789012', '12345678901', '012345678901', '987654321098', '112233445566', '998877665544', '123456123456'];
    return dummies.includes(clean);
  }

  function safePlayChime(freq, duration = 0.4) {
    try {
      if (audioEngine && typeof audioEngine.playChime === 'function') {
        audioEngine.playChime(freq, duration);
      }
    } catch (_) {}
  }

  // 1. OPEN MODAL
  function openModal(stoneId = 'mind') {
    if (!modalRegister) return;
    checkRegistrationStatus();
    fetchDynamicPaymentQrs();
    modalRegister.classList.add('is-open');
    modalRegister.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Auto-select radio button
    const radio = document.querySelector(`input[name="domain"][value="${stoneId}"]`);
    if (radio) {
      radio.checked = true;
      updateDomainBadge(stoneId);
    }

    // Ensure QR code and fee match active team size
    const activeSizeRadio = document.querySelector('input[name="teamSize"]:checked');
    const currentSize = activeSizeRadio ? parseInt(activeSizeRadio.value, 10) : 3;
    if (qrImg) {
      qrImg.src = currentSize === 4 ? dynamicPaymentQrs.member4 : dynamicPaymentQrs.member3;
    }
    const currentFee = currentSize * 349;
    if (qrAmountText) qrAmountText.textContent = `PAY ₹${currentFee.toLocaleString('en-IN')}`;
    if (totalFeeDisplay) totalFeeDisplay.textContent = `₹${currentFee.toLocaleString('en-IN')}`;

    safePlayChime(580);
  }

  // 2. CLOSE MODAL
  function closeModal() {
    if (!modalRegister) return;
    modalRegister.classList.remove('is-open');
    modalRegister.setAttribute('aria-hidden', 'true');
    // Restore overflow if timeline unlocked or default
    if (document.body.classList.contains('timeline-unlocked')) {
      document.body.style.overflowY = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  function updateDomainBadge(stoneId) {
    const stone = STONES.find(s => s.id === stoneId) || STONES[0];
    if (regDomainBadge) {
      regDomainBadge.textContent = `DOMAIN: ${stone.name} // ${stone.domain}`;
      regDomainBadge.style.color = stone.colorHex;
    }
    domainCards.forEach(card => {
      const isMatch = card.getAttribute('data-domain') === stoneId;
      card.classList.toggle('selected', isMatch);
    });
  }

  // Trigger from "WIELD THIS STONE"
  if (btnWieldStone) {
    btnWieldStone.addEventListener('click', () => {
      const activeId = btnWieldStone.getAttribute('data-stone-id') || 'mind';
      audioEngine.playClick();
      openModal(activeId);
    });
  }

  // Trigger from Header "REGISTER SQUAD"
  if (btnNavRegister) {
    btnNavRegister.addEventListener('click', () => {
      audioEngine.playClick();
      openModal('mind');
    });
  }

  // Close triggers
  if (btnCloseRegister) {
    btnCloseRegister.addEventListener('click', () => {
      audioEngine.playClick();
      closeModal();
    });
  }

  if (btnCloseSuccess) {
    btnCloseSuccess.addEventListener('click', () => {
      audioEngine.playClick();
      modalSuccess?.classList.remove('is-open');
      modalSuccess?.setAttribute('aria-hidden', 'true');
    });
  }

  // Focus Areas Matrix Modal Elements
  const modalFocus = document.getElementById('modal-focus-areas');
  const btnCloseFocus = document.getElementById('btn-close-focus');
  const btnCloseFocusAlt = document.getElementById('btn-focus-close-alt');
  const btnViewFocusAreas = document.getElementById('btn-view-focus-areas');
  const btnFocusWieldNow = document.getElementById('btn-focus-wield-now');
  const focusGrid = document.getElementById('focus-matrix-grid');
  const focusTitle = document.getElementById('focus-modal-title');
  const focusTagline = document.getElementById('focus-modal-tagline');
  const focusOverview = document.getElementById('focus-modal-overview');
  const focusBadge = document.getElementById('focus-modal-badge');
  const focusDot = document.getElementById('focus-modal-dot');

  function openFocusAreasModal(stoneId) {
    if (!modalFocus) return;
    const stone = STONES.find(s => s.id === stoneId) || STONES[0];

    if (focusTitle) focusTitle.textContent = stone.domain;
    if (focusTagline) focusTagline.textContent = stone.domainTagline || '';
    if (focusOverview) focusOverview.textContent = stone.description;
    if (focusBadge) {
      focusBadge.textContent = `${stone.name} // SPECIMEN ${stone.index}`;
      focusBadge.style.color = stone.colorHex;
    }
    if (focusDot) {
      focusDot.style.background = stone.colorHex;
      focusDot.style.boxShadow = `0 0 10px ${stone.colorHex}`;
    }

    if (focusGrid) {
      const areas = stone.focusAreas || [];
      focusGrid.innerHTML = areas.map((item, idx) => `
        <div class="focus-area-card" style="--card-accent: ${stone.colorHex}">
          <div class="focus-area-header">
            <span class="focus-area-num">${String(idx + 1).padStart(2, '0')}</span>
            <h4 class="focus-area-title">${item.title}</h4>
          </div>
          <p class="focus-area-desc">${item.desc}</p>
        </div>
      `).join('');
    }

    if (btnFocusWieldNow) {
      btnFocusWieldNow.setAttribute('data-stone-id', stone.id);
    }

    modalFocus.classList.add('is-open');
    modalFocus.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    safePlayChime(640);
  }

  function closeFocusAreasModal() {
    if (!modalFocus) return;
    modalFocus.classList.remove('is-open');
    modalFocus.setAttribute('aria-hidden', 'true');
    if (document.body.classList.contains('timeline-unlocked')) {
      document.body.style.overflowY = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  if (btnViewFocusAreas) {
    btnViewFocusAreas.addEventListener('click', () => {
      const activeId = btnWieldStone?.getAttribute('data-stone-id') || 'mind';
      audioEngine.playClick();
      openFocusAreasModal(activeId);
    });
  }

  if (btnCloseFocus) {
    btnCloseFocus.addEventListener('click', () => {
      audioEngine.playClick();
      closeFocusAreasModal();
    });
  }

  if (btnCloseFocusAlt) {
    btnCloseFocusAlt.addEventListener('click', () => {
      audioEngine.playClick();
      closeFocusAreasModal();
    });
  }

  if (btnFocusWieldNow) {
    btnFocusWieldNow.addEventListener('click', () => {
      const activeId = btnFocusWieldNow.getAttribute('data-stone-id') || 'mind';
      closeFocusAreasModal();
      audioEngine.playClick();
      openModal(activeId);
    });
  }

  // Close on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === modalRegister) closeModal();
    if (e.target === modalFocus) closeFocusAreasModal();
    if (e.target === modalSuccess) {
      modalSuccess.classList.remove('is-open');
      modalSuccess.setAttribute('aria-hidden', 'true');
    }
  });

  // Close on Escape key press (WAI-ARIA compliance)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (modalRegister && modalRegister.classList.contains('is-open')) {
        closeModal();
      }
      if (modalFocus && modalFocus.classList.contains('is-open')) {
        closeFocusAreasModal();
      }
      if (modalSuccess && modalSuccess.classList.contains('is-open')) {
        modalSuccess.classList.remove('is-open');
        modalSuccess.setAttribute('aria-hidden', 'true');
      }
    }
  });

  // Domain Radio change listener
  domainCards.forEach(card => {
    card.addEventListener('click', () => {
      const stoneId = card.getAttribute('data-domain');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updateDomainBadge(stoneId);
      audioEngine.playStoneChime(stoneId);
    });
  });

  // Team Size Toggle listener (3 or 4 members, ₹349 per member)
  sizeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      audioEngine.playClick();
      const size = parseInt(radio.value, 10);
      const fee = size * 349;

      if (qrImg) {
        qrImg.src = size === 4 ? dynamicPaymentQrs.member4 : dynamicPaymentQrs.member3;
      }
      if (qrAmountText) qrAmountText.textContent = `PAY ₹${fee.toLocaleString('en-IN')}`;
      if (totalFeeDisplay) totalFeeDisplay.textContent = `₹${fee.toLocaleString('en-IN')}`;

      if (size === 4) {
        if (member4Card) member4Card.style.display = 'block';
        m4Inputs.forEach(input => input.setAttribute('required', 'true'));
      } else {
        if (member4Card) member4Card.style.display = 'none';
        m4Inputs.forEach(input => {
          input.removeAttribute('required');
          input.value = '';
        });
      }
    });
  });

  // Real-time UTR Uniqueness Check (checks database if UTR exists or not)
  async function verifyUtrUniqueness(utrValue) {
    const clean = (utrValue || '').trim();
    if (!clean) {
      if (utrCheckBadge) {
        utrCheckBadge.textContent = '';
        utrCheckBadge.className = 'utr-status-badge';
      }
      isUtrUnique = false;
      return;
    }

    try {
      const res = await fetch(`/api/verify-utr?utr=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.exists) {
        isUtrUnique = false;
        if (utrCheckBadge) {
          utrCheckBadge.textContent = '❌ Already Registered!';
          utrCheckBadge.className = 'utr-status-badge error';
        }
        setInputError(regUtr, 'This UTR has already been registered with another team.');
      } else {
        isUtrUnique = true;
        clearInputError(regUtr);
        if (utrCheckBadge) {
          utrCheckBadge.textContent = '';
          utrCheckBadge.className = 'utr-status-badge';
        }
      }
    } catch (e) {
      console.warn('UTR verify network warning:', e);
      isUtrUnique = true;
    }
  }

  if (regUtr) {
    regUtr.addEventListener('input', (e) => {
      clearTimeout(utrDebounceTimer);
      utrDebounceTimer = setTimeout(() => {
        verifyUtrUniqueness(e.target.value);
      }, 300);
    });
  }

  // Helper to load Tesseract OCR engine dynamically on demand
  async function loadTesseractOCR() {
    if (window.Tesseract) return window.Tesseract;
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="tesseract"]');
      if (existing) {
        if (window.Tesseract) return resolve(window.Tesseract);
        existing.addEventListener('load', () => resolve(window.Tesseract));
        existing.addEventListener('error', () => reject(new Error('Failed to load OCR engine')));
        return;
      }
      const s = document.createElement('script');
      s.src = '/tesseract/tesseract.min.js';
      s.onload = () => resolve(window.Tesseract);
      s.onerror = () => reject(new Error('Failed to load OCR engine'));
      document.head.appendChild(s);
    });
  }

  // Pre-process and downscale image before OCR to prevent WASM OOM and speed up OCR 10x
  // Validates minimum dimensions to immediately reject tiny logos, icons, and small images
  async function prepareImageForOCR(file) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const origWidth = img.naturalWidth || img.width;
          const origHeight = img.naturalHeight || img.height;

          // Reject images that are too small to be receipts (logos, favicons, tiny icons)
          const isLandscapeReceipt = (origWidth >= 300 && origHeight >= 200);
          const isPortraitReceipt = (origWidth >= 200 && origHeight >= 300);
          if (!isLandscapeReceipt && !isPortraitReceipt) {
            return reject(new Error(`IMAGE_TOO_SMALL:${origWidth}x${origHeight}`));
          }

          const maxDim = 1200;
          let width = origWidth;
          let height = origHeight;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.92);
        };
        img.onerror = () => resolve(file);
        img.src = url;
      } catch (e) {
        resolve(file);
      }
    });
  }

  const MIN_FILE_SIZE = 15 * 1024; // 15 KB Minimum - filters out icons, favicons, small logos
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB Limit
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  // Payment Screenshot Upload & Client AI OCR Telemetry Extraction
  if (regScreenshot) {
    regScreenshot.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Always reset verified state on new selection
      isReceiptVerified = false;
      verifiedReceiptUtr = null;
      isScanningReceipt = true;

      // 1. Enforce Minimum File Size (filters out tiny logos, icons, empty images)
      if (file.size < MIN_FILE_SIZE) {
        showError(`❌ Image file too small (${(file.size / 1024).toFixed(1)} KB). Logos, icons, and small images are not accepted. Please upload an authentic payment receipt screenshot.`);
        regScreenshot.value = '';
        isScanningReceipt = false;
        regScreenshot.classList.add('is-invalid');
        if (ocrBanner) {
          ocrBanner.style.display = 'flex';
          ocrBanner.className = 'ocr-detection-banner error';
          if (ocrIcon) ocrIcon.textContent = '❌';
          if (ocrTitle) ocrTitle.textContent = 'Image File Too Small';
          if (ocrBody) {
            ocrBody.innerHTML = `<strong>Invalid Image:</strong> The file is too small (${(file.size / 1024).toFixed(1)} KB) to be a payment receipt. Logos, icons, and small graphics are rejected.`;
          }
        }
        return;
      }

      // 2. Enforce 20MB Upload Limit
      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        showError(`❌ File size (${sizeMb} MB) exceeds the 20MB limit. Please upload an image under 20MB.`);
        regScreenshot.value = '';
        isScanningReceipt = false;
        regScreenshot.classList.add('is-invalid');
        if (ocrBanner) ocrBanner.style.display = 'none';
        return;
      }

      // 3. Enforce Image File Type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showError(`❌ Invalid file format (${file.type || 'unknown'}). Please upload a PNG, JPG, or WEBP receipt screenshot.`);
        regScreenshot.value = '';
        isScanningReceipt = false;
        regScreenshot.classList.add('is-invalid');
        if (ocrBanner) ocrBanner.style.display = 'none';
        return;
      }

      // 4. Display Scanning Telemetry
      if (ocrBanner) {
        ocrBanner.style.display = 'flex';
        ocrBanner.className = 'ocr-detection-banner scanning';
        if (ocrIcon) ocrIcon.textContent = '🔍';
        if (ocrTitle) ocrTitle.textContent = 'Analyzing Receipt Authenticity...';
        if (ocrBody) ocrBody.innerHTML = `<span class="ocr-scanning">Verifying payment indicators & reading 12-digit UPI UTR...</span>`;
      }

      try {
        const processedBlob = await prepareImageForOCR(file);

        const Tesseract = await loadTesseractOCR();
        if (!Tesseract) throw new Error('OCR not available');

        // Create local worker with zero CORS / cross-origin issues
        let worker = null;
        let result = null;
        try {
          worker = await Tesseract.createWorker('eng', 1, {
            workerPath: '/tesseract/worker.min.js',
            corePath: '/tesseract/tesseract-core.wasm.js',
            langPath: '/tesseract',
            gzip: true,
            logger: m => {
              if (m.status === 'recognizing text' && m.progress) {
                const pct = Math.round(m.progress * 100);
                if (ocrBody) ocrBody.innerHTML = `<span class="ocr-scanning">Scanning receipt contents: ${pct}%...</span>`;
              }
            }
          });

          // 8-second watchdog timer: guarantees fast, non-blocking response on low-power mobile devices
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('OCR_WATCHDOG_TIMEOUT')), 8000));
          const recognizePromise = worker.recognize(processedBlob);
          result = await Promise.race([recognizePromise, timeoutPromise]);
        } finally {
          if (worker) {
            await worker.terminate().catch(() => {});
          }
        }

        const rawText = (result?.data?.text || '').trim();
        const lower = rawText.toLowerCase();

        // 1. Payment Providers & Apps (Score: 2 each)
        const paymentAppKeywords = [
          'google pay', 'gpay', 'g pay', 'g-pay', 'phonepe', 'phone pe', 'paytm', 'pay tm',
          'bhim', 'cred', 'navi', 'amazon pay', 'amazonpay', 'whatsapp pay', 'mobikwik',
          'freecharge', 'airtel payments', 'jupiter', 'fi money', 'fampay', 'slice',
          'super.money', 'payzapp', 'bhim upi', 'omni card'
        ];

        // 2. Financial / Banking Institutions & Rail (Score: 1 each)
        const bankKeywords = [
          'state bank', 'sbi', 'hdfc', 'icici', 'axis bank', 'axis', 'kotak', 'canara',
          'bank of baroda', 'punjab national', 'pnb', 'union bank', 'idfc', 'indusind',
          'yes bank', 'npci', 'upi', 'imps', 'neft', 'rtgs', 'netbanking', 'central bank',
          'bank of india', 'indian bank', 'uco bank', 'bank of maharashtra'
        ];

        // 3. Payment Status & Action Verbs (Score: 2 each)
        const paymentActionKeywords = [
          'payment successful', 'transaction successful', 'paid successfully', 'transfer successful',
          'payment completed', 'paid to', 'payment to', 'payment of', 'money sent',
          'sent to', 'debited from', 'credited to', 'bill payment', 'payment details',
          'transaction details', 'banking name', 'funds transfer', 'completed', 'successful',
          'transferred to', 'transferred', 'sent successfully', 'received by', 'remittance'
        ];

        // 4. Reference & Transaction Identifiers (Score: 2 each)
        const paymentRefKeywords = [
          'upi ref', 'upi transaction id', 'upi transaction', 'google transaction id',
          'phonepe transaction id', 'paytm order id', 'wallet txn id', 'ref no',
          'reference no', 'transaction id', 'txn id', 'rrn', 'utr', 'order id', 'utr no',
          'ref number', 'reference id', 'transfer details'
        ];

        // 5. Currency Markers (Score: 1 each)
        const currencyKeywords = ['₹', 'inr', 'rs.', 'rs ', 'rupees', 'rs:'];

        // 6. UPI Handles / VPA Patterns (Score: 2 each)
        const upiHandleKeywords = [
          '@upi', '@okhdfcbank', '@okaxis', '@oksbi', '@okicici', '@ybl', '@ibl', '@axl',
          '@paytm', '@apl', '@ikwik', '@barodampay', '@idbi', '@federal', '@kotak'
        ];

        // 7. Explicit Non-Payment Indicators (Immediate Disqualifiers)
        const nonPaymentCategories = [
          {
            type: 'Code & Development Screen',
            keywords: ['github.com', 'stackoverflow', 'localhost', 'syntax error', 'uncaught error', 'traceback', 'stack trace', 'console.log', 'npm install', 'terminal', 'docker', 'vscode', 'exception in thread', 'trying to access array offset', 'undefined index', 'fatal error']
          },
          {
            type: 'Academic Portal / Exam Document',
            keywords: ['nptel', 'candidate_login', 'noc candidate', 'hall ticket', 'admit card', 'marksheet', 'semester', 'roll number', 'registration number:', 'grade card', 'question paper', 'curriculum vitae', 'resume', 'provisional certificate', 'login/index.php']
          },
          {
            type: 'Logo or Graphic Illustration',
            keywords: ['stock vector', 'getty images', 'shutterstock', 'freepik', 'watermark', 'clipart', 'wallpaper', 'vector illustration', 'graphic design', 'behance', 'dribbble', 'brand identity', 'logo design']
          },
          {
            type: 'Social Media / Entertainment App',
            keywords: ['instagram', 'facebook', 'snapchat', 'tiktok', 'netflix', 'spotify', 'youtube', 'reels', 'retweet']
          },
          {
            type: 'E-commerce Shopping / Travel Ticket',
            keywords: ['add to cart', 'shopping cart', 'buy now', 'item details', 'boarding pass', 'flight booking', 'train ticket', 'pnr status', 'irctc']
          }
        ];

        // Extract 12-digit UTR numbers (supporting spaced/dashed format like 7449 8027 9774)
        let detectedUtr = null;
        const labeledMatch = rawText.match(/(?:utr|upi\s*ref(?:erence)?(?:\s*no)?|rrn|txn\s*(?:id|no)?|transaction\s*(?:id|ref|no)?)[\s:.-]*([0-9\s-]{12,18})\b/i);
        if (labeledMatch && labeledMatch[1]) {
          const digits = labeledMatch[1].replace(/[\s-]/g, '');
          if (digits.length === 12 && !isDummyUtr(digits)) {
            detectedUtr = digits;
          }
        }

        if (!detectedUtr) {
          const formattedMatch = rawText.match(/\b([0-9]{4}[\s-][0-9]{4}[\s-][0-9]{4})\b/);
          if (formattedMatch && formattedMatch[1]) {
            const digits = formattedMatch[1].replace(/[\s-]/g, '');
            if (digits.length === 12 && !isDummyUtr(digits)) {
              detectedUtr = digits;
            }
          }
        }

        if (!detectedUtr) {
          const twelveDigits = rawText.match(/\b([0-9]{12})\b/g) || [];
          detectedUtr = twelveDigits.find(n => !isDummyUtr(n)) || null;
        }

        // Extract payer phone ONLY if explicitly labeled with phone/mobile header (never from transaction IDs)
        const phoneMatch = rawText.match(/(?:phone|mobile|mob|contact|ph|payer\s*phone|remitter\s*mobile)[\s:.-]*(?:\+91[\s-]?)?([6-9][0-9]{9})\b/i);
        if (phoneMatch && phoneMatch[1] && regPayPhone && !regPayPhone.value) {
          regPayPhone.value = phoneMatch[1];
        }

        // Perform semantic matching
        const matchedApps = paymentAppKeywords.filter(kw => lower.includes(kw));
        const matchedBanks = bankKeywords.filter(kw => lower.includes(kw));
        const matchedActions = paymentActionKeywords.filter(kw => lower.includes(kw));
        const matchedRefs = paymentRefKeywords.filter(kw => lower.includes(kw));
        const matchedCurrencies = currencyKeywords.filter(kw => lower.includes(kw));
        const matchedHandles = upiHandleKeywords.filter(kw => lower.includes(kw));

        let paymentScore = (matchedApps.length * 2) +
                           (matchedBanks.length * 1) +
                           (matchedActions.length * 2) +
                           (matchedRefs.length * 2) +
                           (matchedCurrencies.length * 1) +
                           (matchedHandles.length * 2);

        if (detectedUtr) paymentScore += 3;

        // Check non-payment disqualifiers
        let disqualifierMatch = null;
        for (const cat of nonPaymentCategories) {
          const match = cat.keywords.find(kw => lower.includes(kw));
          if (match) {
            disqualifierMatch = { category: cat.type, keyword: match };
            break;
          }
        }

        // Evaluate whether this image is an authentic payment receipt
        let isReceiptValid = true;
        let rejectReason = '';

        const hasStrongUtr = Boolean(detectedUtr && !isDummyUtr(detectedUtr));
        const hasPaymentAction = matchedActions.length > 0;
        const hasPaymentAppOrBank = matchedApps.length > 0 || matchedBanks.length > 0 || matchedRefs.length > 0;

        if (rawText.length < 15) {
          isReceiptValid = false;
          rejectReason = 'No payment text found. Camera photos, logos, and plain graphics without transaction details are not allowed';
        } else if (disqualifierMatch && paymentScore < 6) {
          isReceiptValid = false;
          rejectReason = `Image identified as a ${disqualifierMatch.category} (matched '${disqualifierMatch.keyword}')`;
        } else if (hasStrongUtr && (hasPaymentAction || hasPaymentAppOrBank || paymentScore >= 3)) {
          // Authentic receipt with valid 12-digit UTR and payment context!
          isReceiptValid = true;
        } else if (!hasStrongUtr && !hasPaymentAction) {
          isReceiptValid = false;
          rejectReason = 'Missing payment action or transaction status (e.g. Paid to, Successful, Debited). Logos and normal photos are not accepted';
        } else if (!hasStrongUtr && paymentScore < 4) {
          isReceiptValid = false;
          rejectReason = 'Image does not contain sufficient payment markers. Only authentic Google Pay, PhonePe, Paytm, or bank receipts are accepted';
        }

        // ==========================================
        // OUTCOME A: REJECT (Non-Payment / Logo / Small Image / Photo)
        // ==========================================
        if (!isReceiptValid) {
          isReceiptVerified = false;
          verifiedReceiptUtr = null;
          isScanningReceipt = false;
          regScreenshot.value = ''; // Drop invalid file!
          regScreenshot.classList.add('is-invalid');

          if (ocrBanner) {
            ocrBanner.className = 'ocr-detection-banner error';
            if (ocrIcon) ocrIcon.textContent = '❌';
            if (ocrTitle) ocrTitle.textContent = 'Receipt Verification FAILED';
            if (ocrBody) {
              ocrBody.innerHTML = `<strong>Invalid Receipt:</strong> ${rejectReason}. Please upload an authentic screenshot of your payment receipt.`;
            }
          }
          safePlayChime(220);
          showError(`❌ Verification Failed: ${rejectReason}.`);
          return;
        }

        // ==========================================
        // OUTCOME B: ACCEPT (Authentic Payment Receipt)
        // ==========================================
        isReceiptVerified = true;
        verifiedReceiptUtr = detectedUtr;
        isScanningReceipt = false;
        regScreenshot.classList.remove('is-invalid');

        if (ocrBanner) {
          ocrBanner.className = 'ocr-detection-banner success';
          if (ocrIcon) ocrIcon.textContent = '✅';
          if (ocrTitle) ocrTitle.textContent = 'Authentic Receipt Verified';
          if (ocrBody) {
            ocrBody.innerHTML = `Genuine payment receipt verified. Please enter your <strong>12-digit bank UTR number</strong> below.`;
          }
        }

        if (regUtr && regUtr.value.trim()) {
          verifyUtrUniqueness(regUtr.value);
        } else if (utrCheckBadge) {
          utrCheckBadge.textContent = '';
          utrCheckBadge.className = 'utr-status-badge';
        }

        safePlayChime(720);
        return;

      } catch (err) {
        console.warn('OCR processing watchdog / fallback triggered:', err);
        isScanningReceipt = false;

        // FAIL-SOFT FOR MOBILE & HACKATHONS:
        // If image passed dimensions/size, do NOT discard the file on mobile devices!
        // Allow the participant to proceed by manually entering their 12-digit bank UTR!
        const isTooSmall = err.message && err.message.startsWith('IMAGE_TOO_SMALL');

        if (file && file.size >= MIN_FILE_SIZE && !isTooSmall) {
          isReceiptVerified = true;
          verifiedReceiptUtr = null;
          regScreenshot.classList.remove('is-invalid');

          if (ocrBanner) {
            ocrBanner.className = 'ocr-detection-banner warning';
            if (ocrIcon) ocrIcon.textContent = 'ℹ️';
            if (ocrTitle) ocrTitle.textContent = 'Receipt Attached • Manual UTR Entry';
            if (ocrBody) {
              ocrBody.innerHTML = `Receipt captured successfully! Automated OCR scan was deferred on this device. <strong>Please enter your 12-digit bank UTR number manually below</strong> to proceed.`;
            }
          }
          if (regUtr) {
            regUtr.focus();
            if (regUtr.value.trim()) verifyUtrUniqueness(regUtr.value);
          }
          safePlayChime(580);
          return;
        }

        isReceiptVerified = false;
        verifiedReceiptUtr = null;
        regScreenshot.value = ''; // Drop rejected tiny file
        regScreenshot.classList.add('is-invalid');

        let msg = 'Could not verify image as an authentic payment receipt.';
        if (isTooSmall) {
          msg = 'Image dimensions are too small to be a payment receipt screenshot. Logos, icons, and small images are not accepted.';
        }

        if (ocrBanner) {
          ocrBanner.className = 'ocr-detection-banner error';
          if (ocrIcon) ocrIcon.textContent = '❌';
          if (ocrTitle) ocrTitle.textContent = 'Receipt Verification Rejected';
          if (ocrBody) {
            ocrBody.innerHTML = `<strong>Verification Failed:</strong> ${msg} Please upload an authentic Google Pay, PhonePe, or Paytm receipt.`;
          }
        }
        safePlayChime(220);
        showError(`❌ ${msg}`, regScreenshot);
      }
    });
  }

  // Validation & Formatting Helpers
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  function normalizePhone(phone) {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    return digits;
  }

  function isValidEmail(email) {
    return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
  }

  function isValidPhone(phone) {
    const digits = normalizePhone(phone);
    return digits.length >= 10 && digits.length <= 14;
  }

  function setInputError(inputEl, msg) {
    if (!inputEl) return;
    inputEl.classList.add('is-invalid');
    let parent = inputEl.parentElement;
    let hint = parent ? parent.querySelector(':scope > .field-error-hint') : null;
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'field-error-hint';
      inputEl.insertAdjacentElement('afterend', hint);
    }
    hint.textContent = msg;
  }

  function clearInputError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid');
    const hint = inputEl.parentElement ? inputEl.parentElement.querySelector(':scope > .field-error-hint') : null;
    if (hint) hint.remove();
  }

  // Real-time verify participant email or phone against database
  async function checkParticipantConflictAsync(field, value, inputEl, role) {
    if (!value) return;
    try {
      const param = field === 'email' ? `email=${encodeURIComponent(value.trim().toLowerCase())}` : `phone=${encodeURIComponent(value)}`;
      const res = await fetch(`/api/verify-participant?${param}`);
      const data = await res.json();
      if (data.exists) {
        const fieldLabel = field === 'email' ? 'Email' : 'Mobile number';
        setInputError(inputEl, `❌ ${fieldLabel} already registered in team '${data.teamName}' (${data.teamId})`);
        safePlayChime(220);
      }
    } catch (e) {
      // Offline or network error: silent
    }
  }

  // Attach real-time validation listeners to input fields
  const trackedInputs = [
    { id: 'reg-leader-email', type: 'email', role: 'Team Leader' },
    { id: 'reg-leader-phone', type: 'phone', role: 'Team Leader' },
    { id: 'reg-m2-email', type: 'email', role: 'Member 02' },
    { id: 'reg-m2-phone', type: 'phone', role: 'Member 02' },
    { id: 'reg-m3-email', type: 'email', role: 'Member 03' },
    { id: 'reg-m3-phone', type: 'phone', role: 'Member 03' },
    { id: 'reg-m4-email', type: 'email', role: 'Member 04' },
    { id: 'reg-m4-phone', type: 'phone', role: 'Member 04' },
  ];

  trackedInputs.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;

    el.addEventListener('input', () => {
      clearInputError(el);
    });

    el.addEventListener('blur', () => {
      const val = el.value.trim();
      if (!val) return;

      if (item.type === 'email') {
        if (!isValidEmail(val)) {
          setInputError(el, 'Invalid email address (e.g. name@domain.com)');
          return;
        }
        checkParticipantConflictAsync('email', val, el, item.role);
      } else if (item.type === 'phone') {
        if (!isValidPhone(val)) {
          setInputError(el, 'Enter a valid 10-digit mobile number');
          return;
        }
        checkParticipantConflictAsync('phone', val, el, item.role);
      }
    });
  });

  // Form Submit Handler
  if (formReg) {
    formReg.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (regErrorMsg) regErrorMsg.style.display = 'none';

      // Clear any prior field errors
      document.querySelectorAll('.form-input.is-invalid').forEach(clearInputError);

      const teamName = document.getElementById('reg-team-name')?.value.trim();
      const college = document.getElementById('reg-college')?.value.trim();
      const preferredDomain = document.querySelector('input[name="domain"]:checked')?.value || 'mind';
      const techStack = document.getElementById('reg-tech-stack')?.value?.trim() || '';
      const teamSize = document.querySelector('input[name="teamSize"]:checked')?.value || '3';
      const leaderName = document.getElementById('reg-leader-name')?.value.trim();
      const leaderPhone = document.getElementById('reg-leader-phone')?.value.trim();
      const leaderEmail = document.getElementById('reg-leader-email')?.value.trim();
      const teamPassword = document.getElementById('reg-team-password')?.value;
      const paymentUtr = regUtr?.value.trim();
      const paymentPhone = regPayPhone?.value.trim() || leaderPhone;
      const screenshotFile = regScreenshot?.files[0];

      // 1. Mandatory Core Validation
      if (!teamName) {
        const el = document.getElementById('reg-team-name');
        showError('Please enter your Squad / Team Name.', el);
        el?.focus();
        return;
      }
      if (!college) {
        const el = document.getElementById('reg-college');
        showError('Please enter your College or Institution name.', el);
        el?.focus();
        return;
      }
      if (!leaderName) {
        const el = document.getElementById('reg-leader-name');
        showError('Please enter Leader Full Name.', el);
        el?.focus();
        return;
      }
      if (!isValidEmail(leaderEmail)) {
        const el = document.getElementById('reg-leader-email');
        setInputError(el, 'Invalid email format');
        showError('Please enter a valid Leader Email address (e.g. name@domain.com).', el);
        el?.focus();
        return;
      }
      if (!isValidPhone(leaderPhone)) {
        const el = document.getElementById('reg-leader-phone');
        setInputError(el, 'Enter a valid 10-digit number');
        showError('Please enter a valid 10-digit Leader Mobile Number.', el);
        el?.focus();
        return;
      }
      if (!teamPassword || teamPassword.length < 6) {
        const el = document.getElementById('reg-team-password');
        setInputError(el, 'Minimum 6 characters');
        showError('Team Password must be at least 6 characters (used for Leader Portal login).', el);
        el?.focus();
        return;
      }

      // 2. Validate Member 2
      const m2Name = document.getElementById('reg-m2-name')?.value.trim();
      const m2Email = document.getElementById('reg-m2-email')?.value.trim();
      const m2Phone = document.getElementById('reg-m2-phone')?.value.trim();
      if (!m2Name) {
        const el = document.getElementById('reg-m2-name');
        setInputError(el, 'Member 02 name required');
        showError('Member 02 Full Name is required.', el);
        el?.focus();
        return;
      }
      if (!isValidEmail(m2Email)) {
        const el = document.getElementById('reg-m2-email');
        setInputError(el, 'Invalid email format');
        showError('Member 02 has an invalid email format.', el);
        el?.focus();
        return;
      }
      if (!isValidPhone(m2Phone)) {
        const el = document.getElementById('reg-m2-phone');
        setInputError(el, 'Enter a valid 10-digit number');
        showError('Member 02 requires a valid 10-digit phone number.', el);
        el?.focus();
        return;
      }

      // 3. Validate Member 3
      const m3Name = document.getElementById('reg-m3-name')?.value.trim();
      const m3Email = document.getElementById('reg-m3-email')?.value.trim();
      const m3Phone = document.getElementById('reg-m3-phone')?.value.trim();
      if (!m3Name) {
        const el = document.getElementById('reg-m3-name');
        setInputError(el, 'Member 03 name required');
        showError('Member 03 Full Name is required.', el);
        el?.focus();
        return;
      }
      if (!isValidEmail(m3Email)) {
        const el = document.getElementById('reg-m3-email');
        setInputError(el, 'Invalid email format');
        showError('Member 03 has an invalid email format.', el);
        el?.focus();
        return;
      }
      if (!isValidPhone(m3Phone)) {
        const el = document.getElementById('reg-m3-phone');
        setInputError(el, 'Enter a valid 10-digit number');
        showError('Member 03 requires a valid 10-digit phone number.', el);
        el?.focus();
        return;
      }

      const members = [
        { name: m2Name, email: m2Email, phone: m2Phone },
        { name: m3Name, email: m3Email, phone: m3Phone }
      ];

      // 4. Validate Member 4 if Team Size is 4
      if (teamSize === '4') {
        const m4Name = document.getElementById('reg-m4-name')?.value.trim();
        const m4Email = document.getElementById('reg-m4-email')?.value.trim();
        const m4Phone = document.getElementById('reg-m4-phone')?.value.trim();
        if (!m4Name) {
          const el = document.getElementById('reg-m4-name');
          setInputError(el, 'Member 04 name required');
          showError('Member 04 Full Name is required for 4-member squads.', el);
          el?.focus();
          return;
        }
        if (!isValidEmail(m4Email)) {
          const el = document.getElementById('reg-m4-email');
          setInputError(el, 'Invalid email format');
          showError('Member 04 has an invalid email format.', el);
          el?.focus();
          return;
        }
        if (!isValidPhone(m4Phone)) {
          const el = document.getElementById('reg-m4-phone');
          setInputError(el, 'Enter a valid 10-digit number');
          showError('Member 04 requires a valid 10-digit phone number.', el);
          el?.focus();
          return;
        }
        members.push({ name: m4Name, email: m4Email, phone: m4Phone });
      }

      // 5. Intra-Team Duplicate Checks (No duplicate emails or phones in squad)
      const allParticipants = [
        { role: 'Team Leader', email: leaderEmail.toLowerCase(), phone: normalizePhone(leaderPhone), el: document.getElementById('reg-leader-email'), phoneEl: document.getElementById('reg-leader-phone') },
        { role: 'Member 02', email: m2Email.toLowerCase(), phone: normalizePhone(m2Phone), el: document.getElementById('reg-m2-email'), phoneEl: document.getElementById('reg-m2-phone') },
        { role: 'Member 03', email: m3Email.toLowerCase(), phone: normalizePhone(m3Phone), el: document.getElementById('reg-m3-email'), phoneEl: document.getElementById('reg-m3-phone') },
      ];
      if (teamSize === '4') {
        allParticipants.push({
          role: 'Member 04',
          email: members[2].email.toLowerCase(),
          phone: normalizePhone(members[2].phone),
          el: document.getElementById('reg-m4-email'),
          phoneEl: document.getElementById('reg-m4-phone')
        });
      }

      const seenEmails = new Map();
      for (const p of allParticipants) {
        if (seenEmails.has(p.email)) {
          const prev = seenEmails.get(p.email);
          const msg = `Duplicate email '${p.email}' in squad (${prev} and ${p.role}). Every member must have a unique email.`;
          setInputError(p.el, 'Duplicate email in squad');
          showError(msg, p.el);
          p.el?.focus();
          return;
        }
        seenEmails.set(p.email, p.role);
      }

      const seenPhones = new Map();
      for (const p of allParticipants) {
        if (seenPhones.has(p.phone)) {
          const prev = seenPhones.get(p.phone);
          const msg = `Duplicate mobile number in squad (${prev} and ${p.role}). Every member must have their own unique phone number.`;
          setInputError(p.phoneEl, 'Duplicate phone in squad');
          showError(msg, p.phoneEl);
          p.phoneEl?.focus();
          return;
        }
        seenPhones.set(p.phone, p.role);
      }

      // 6. Payment & Receipt Verification
      if (isScanningReceipt) {
        const el = document.getElementById('ocr-banner') || document.getElementById('reg-screenshot');
        showError('⏳ AI OCR is currently analyzing your receipt screenshot. Please wait a moment...', el);
        return;
      }

      if (!screenshotFile) {
        const el = document.getElementById('reg-screenshot');
        setInputError(el, 'Payment screenshot required');
        showError('Please upload your payment confirmation screenshot.', el);
        el?.focus();
        return;
      }

      if (screenshotFile.size < MIN_FILE_SIZE) {
        const el = document.getElementById('reg-screenshot');
        setInputError(el, 'Image file too small');
        showError(`Image file too small (${(screenshotFile.size / 1024).toFixed(1)} KB). Logos, icons, and small images are not accepted. Please upload an authentic receipt screenshot.`, el);
        el?.focus();
        return;
      }

      if (screenshotFile.size > MAX_FILE_SIZE) {
        const sizeMb = (screenshotFile.size / (1024 * 1024)).toFixed(1);
        const el = document.getElementById('reg-screenshot');
        setInputError(el, 'File exceeds 20MB');
        showError(`Payment screenshot file size (${sizeMb} MB) exceeds the 20MB limit. Please upload an image under 20MB.`, el);
        el?.focus();
        return;
      }

      if (!isReceiptVerified) {
        const el = document.getElementById('reg-screenshot');
        setInputError(el, 'Valid receipt required');
        showError('❌ Valid Payment Receipt Required: The uploaded image was not verified as an authentic payment receipt. Logos, icons, and non-payment photos are not allowed. Please upload an authentic receipt from Google Pay, PhonePe, Paytm, or netbanking.', el);
        el?.focus();
        return;
      }

      if (!paymentUtr) {
        const el = document.getElementById('reg-utr');
        setInputError(el, '12-digit UTR required');
        showError('Please enter your payment bank UTR / transaction reference number.', el);
        el?.focus();
        return;
      }

      const cleanUtr = paymentUtr.trim();

      // Escape helper for safe confirmation rendering
      function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      // Build FormData payload
      const formData = new FormData();
      formData.append('teamName', teamName);
      formData.append('college', college);
      formData.append('preferredDomain', preferredDomain);
      formData.append('techStack', techStack);
      formData.append('teamSize', teamSize);
      formData.append('teamPassword', teamPassword);
      formData.append('leaderName', leaderName);
      formData.append('leaderPhone', leaderPhone);
      formData.append('leaderEmail', leaderEmail);
      formData.append('paymentUtr', paymentUtr);
      formData.append('paymentPhone', paymentPhone);
      formData.append('members', JSON.stringify(members));
      formData.append('paymentScreenshot', screenshotFile);

      pendingFormData = formData;

      // Populate Confirmation Modal with all entered details
      const confTeamName = document.getElementById('conf-team-name');
      const confCollege = document.getElementById('conf-college');
      const confDomain = document.getElementById('conf-domain');
      const confTeamSize = document.getElementById('conf-team-size');
      const confTechStack = document.getElementById('conf-tech-stack');
      const confAmount = document.getElementById('conf-amount');
      const confUtr = document.getElementById('conf-utr');
      const confPayPhone = document.getElementById('conf-pay-phone');
      const confRosterList = document.getElementById('conf-roster-list');
      const confReceiptThumb = document.getElementById('conf-receipt-thumb');
      const confReceiptNoThumb = document.getElementById('conf-receipt-no-thumb');
      const confReceiptFilename = document.getElementById('conf-receipt-filename');

      if (confTeamName) confTeamName.textContent = teamName;
      if (confCollege) confCollege.textContent = college;

      const chosenStone = STONES.find(s => s.id === preferredDomain) || STONES[0];
      if (confDomain) {
        confDomain.textContent = `${chosenStone.name} // ${chosenStone.domain}`;
        confDomain.style.color = chosenStone.colorHex || '#00d2ff';
      }

      const totalFee = parseInt(teamSize, 10) * 349;
      if (confTeamSize) confTeamSize.textContent = `${teamSize} Members (₹${totalFee.toLocaleString('en-IN')})`;
      if (confTechStack) confTechStack.textContent = techStack || 'General Hackathon Track';
      if (confAmount) confAmount.textContent = `₹${totalFee.toLocaleString('en-IN')}`;
      if (confUtr) confUtr.textContent = cleanUtr;
      if (confPayPhone) confPayPhone.textContent = paymentPhone;

      if (confPassword) {
        confPassword.textContent = '••••••••';
        confPassword.dataset.raw = teamPassword;
      }
      if (btnToggleConfPw) {
        btnToggleConfPw.textContent = 'VIEW';
      }

      // Populate Roster list
      if (confRosterList) {
        confRosterList.innerHTML = '';
        const rosterEntries = [
          { role: 'LEADER / CAPTAIN', name: leaderName, email: leaderEmail, phone: leaderPhone, isLeader: true },
          { role: 'MEMBER 02', name: m2Name, email: m2Email, phone: m2Phone, isLeader: false },
          { role: 'MEMBER 03', name: m3Name, email: m3Email, phone: m3Phone, isLeader: false }
        ];
        if (teamSize === '4' && members[2]) {
          rosterEntries.push({ role: 'MEMBER 04', name: members[2].name, email: members[2].email, phone: members[2].phone, isLeader: false });
        }

        rosterEntries.forEach(entry => {
          const row = document.createElement('div');
          row.className = 'confirm-roster-item';
          row.innerHTML = `
            <div class="confirm-member-info">
              <div class="confirm-member-name">${escapeHtml(entry.name)}</div>
              <div class="confirm-member-meta">${escapeHtml(entry.email)} • ${escapeHtml(entry.phone)}</div>
            </div>
            <span class="confirm-member-role-badge" style="${entry.isLeader ? 'background:rgba(255,208,0,0.15); color:#ffd000; border-color:#ffd000;' : ''}">${entry.role}</span>
          `;
          confRosterList.appendChild(row);
        });
      }

      // Receipt preview
      if (screenshotFile) {
        try {
          const thumbUrl = URL.createObjectURL(screenshotFile);
          if (confReceiptThumb) {
            confReceiptThumb.src = thumbUrl;
            confReceiptThumb.style.display = 'block';
          }
          if (confReceiptNoThumb) confReceiptNoThumb.style.display = 'none';
        } catch (_) {}
        if (confReceiptFilename) {
          confReceiptFilename.textContent = `${screenshotFile.name} (${(screenshotFile.size / 1024).toFixed(1)} KB)`;
        }
      }

      // Open the confirmation window
      if (modalConfirm) {
        const scrollArea = modalConfirm.querySelector('.confirm-details-scroll');
        if (scrollArea) scrollArea.scrollTop = 0;
        modalConfirm.classList.add('is-open');
        modalConfirm.setAttribute('aria-hidden', 'false');
      }
      safePlayChime(580, 0.25);
    });
  }

  // Confirmation Modal Handlers
  function closeConfirmModal() {
    if (!modalConfirm) return;
    modalConfirm.classList.remove('is-open');
    modalConfirm.setAttribute('aria-hidden', 'true');
  }

  if (btnCloseConfirm) btnCloseConfirm.addEventListener('click', closeConfirmModal);
  if (btnBackEdit) btnBackEdit.addEventListener('click', closeConfirmModal);
  if (modalConfirm) {
    modalConfirm.addEventListener('click', (e) => {
      if (e.target === modalConfirm) closeConfirmModal();
    });
  }

  // Toggle Password in Confirmation Modal
  if (btnToggleConfPw) {
    btnToggleConfPw.addEventListener('click', () => {
      if (!confPassword) return;
      const isMasked = confPassword.textContent.includes('•');
      if (isMasked) {
        confPassword.textContent = confPassword.dataset.raw || '';
        btnToggleConfPw.textContent = 'HIDE';
      } else {
        confPassword.textContent = '••••••••';
        btnToggleConfPw.textContent = 'VIEW';
      }
    });
  }

  // Final Submission Trigger from Confirmation Modal
  if (btnConfirmFinal) {
    btnConfirmFinal.addEventListener('click', async () => {
      if (!pendingFormData) return;

      if (btnConfirmFinal) btnConfirmFinal.disabled = true;
      if (confSubmitSpinner) confSubmitSpinner.style.display = 'inline-block';
      if (confSubmitText) confSubmitText.textContent = 'COMMISSIONING SQUAD...';
      if (btnBackEdit) btnBackEdit.disabled = true;

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          body: pendingFormData,
        });

        const resData = await response.json();

        if (!response.ok || !resData.success) {
          throw new Error(resData.error || 'Registration failed. Please verify your details.');
        }

        // Successful registration!
        closeConfirmModal();
        closeModal();
        audioEngine.playConvergenceChord();

        // Populate Success Modal with full squad details and member roster
        const sucTeamId = document.getElementById('suc-team-id');
        const sucTeamName = document.getElementById('suc-team-name');
        const sucCollege = document.getElementById('suc-college');
        const sucDomain = document.getElementById('suc-domain');
        const sucEmail = document.getElementById('suc-email');
        const sucAmount = document.getElementById('suc-amount');
        const sucUtr = document.getElementById('suc-utr');
        const sucRosterList = document.getElementById('suc-roster-list');

        const submittedCollege = resData.team.college || pendingFormData?.get('college') || '-';
        const submittedUtr = resData.team.utr || pendingFormData?.get('paymentUtr') || '-';
        const leaderNameVal = resData.team.leader?.name || pendingFormData?.get('leaderName') || 'Team Captain';
        const leaderEmailVal = resData.team.leader?.email || resData.team.leaderEmail || pendingFormData?.get('leaderEmail') || '-';
        const leaderPhoneVal = resData.team.leader?.phone || pendingFormData?.get('leaderPhone') || '';

        let membersList = [];
        try {
          if (Array.isArray(resData.team.members) && resData.team.members.length > 0) {
            membersList = resData.team.members;
          } else {
            const raw = pendingFormData?.get('members');
            membersList = raw ? JSON.parse(raw) : [];
          }
        } catch (_) {
          membersList = [];
        }

        const stoneObj = STONES.find(s => s.id === resData.team.preferredDomain) || STONES[0];

        if (sucTeamId) sucTeamId.textContent = resData.team.id;
        if (sucTeamName) sucTeamName.textContent = resData.team.teamName;
        if (sucCollege) sucCollege.textContent = submittedCollege;
        if (sucDomain) {
          sucDomain.textContent = `${stoneObj.name} // ${stoneObj.domain}`;
          sucDomain.style.color = stoneObj.colorHex || '#00d2ff';
        }
        if (sucEmail) sucEmail.textContent = leaderEmailVal;
        if (sucAmount) sucAmount.textContent = `₹${resData.team.amount.toLocaleString('en-IN')}`;
        if (sucUtr) sucUtr.textContent = submittedUtr;

        const sucMailRecipient = document.getElementById('suc-mail-recipient');
        if (sucMailRecipient) sucMailRecipient.textContent = leaderEmailVal;

        // Auto-login session preparation
        if (resData.token) {
          try {
            sessionStorage.setItem('infinity_leader_auth', JSON.stringify({ token: resData.token }));
            localStorage.setItem('infinity_leader_auth', JSON.stringify({ token: resData.token }));
          } catch (_) {}
        }

        const btnGoLeader = document.getElementById('btn-go-leader');
        if (btnGoLeader) {
          const autoLoginUrl = resData.token
            ? `/leader.html?autologin=1#token=${encodeURIComponent(resData.token)}`
            : `/leader.html?team=${encodeURIComponent(resData.team.id)}&email=${encodeURIComponent(leaderEmailVal)}`;

          btnGoLeader.href = autoLoginUrl;
          btnGoLeader.innerHTML = `<span>⚡ AUTO-LOGIN TO LEADER PAGE</span> &rarr;`;

          btnGoLeader.onclick = () => {
            if (resData.token) {
              try {
                sessionStorage.setItem('infinity_leader_auth', JSON.stringify({ token: resData.token }));
                localStorage.setItem('infinity_leader_auth', JSON.stringify({ token: resData.token }));
              } catch (_) {}
            }
          };
        }

        // Populate Member Roster in Success Modal
        if (sucRosterList) {
          sucRosterList.innerHTML = '';

          const fullRoster = [
            { role: 'LEADER / CAPTAIN', name: leaderNameVal, email: leaderEmailVal, phone: leaderPhoneVal, isLeader: true },
            ...membersList.map((m, idx) => ({
              role: `MEMBER 0${idx + 2}`,
              name: m.name,
              email: m.email,
              phone: m.phone,
              isLeader: false
            }))
          ];

          fullRoster.forEach(m => {
            const row = document.createElement('div');
            row.className = 'suc-member-row';
            row.innerHTML = `
              <div class="suc-member-info">
                <div class="suc-member-name">
                  <span>${escapeHtml(m.name)}</span>
                  <span class="suc-member-badge ${m.isLeader ? '' : 'member'}">${m.role}</span>
                </div>
                <div class="suc-member-meta">${escapeHtml(m.email)} • ${escapeHtml(m.phone)}</div>
              </div>
            `;
            sucRosterList.appendChild(row);
          });
        }

        if (modalSuccess) {
          modalSuccess.classList.add('is-open');
          modalSuccess.setAttribute('aria-hidden', 'false');
        }

        if (formReg) formReg.reset();
        pendingFormData = null;
        isReceiptVerified = false;
        verifiedReceiptUtr = null;
        isUtrUnique = false;
        isScanningReceipt = false;
        if (ocrBanner) ocrBanner.style.display = 'none';
        if (qrImg) qrImg.src = '/3mem.png';
        if (qrAmountText) qrAmountText.textContent = 'PAY ₹1,047';
        if (totalFeeDisplay) totalFeeDisplay.textContent = '₹1,047';
        if (member4Card) member4Card.style.display = 'none';
        m4Inputs.forEach(input => {
          input.removeAttribute('required');
          input.value = '';
        });

      } catch (err) {
        closeConfirmModal();
        showError(err.message);
      } finally {
        if (btnConfirmFinal) btnConfirmFinal.disabled = false;
        if (confSubmitSpinner) confSubmitSpinner.style.display = 'none';
        if (confSubmitText) confSubmitText.textContent = 'CONFIRM & LOCK SQUAD ✦';
        if (btnBackEdit) btnBackEdit.disabled = false;
        if (btnSubmit) btnSubmit.disabled = false;
        if (regSpinner) regSpinner.style.display = 'none';
      }
    });
  }

  function showError(msg, targetEl = null) {
    if (regErrorMsg) {
      regErrorMsg.textContent = msg;
      regErrorMsg.style.display = 'block';
      safePlayChime(220); // alert tone
    }
    const scrollTarget = targetEl || regErrorMsg;
    if (scrollTarget) {
      try {
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_) {}
    }
  }

  // Setup FAQ Accordion Toggles
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      audioEngine.playClick();
      const item = btn.parentElement;
      item.classList.toggle('active');
    });
  });

  // Setup Portals Dropdown Toggle
  const btnPortals = document.getElementById('btn-portals');
  const portalsMenu = document.getElementById('portals-menu');
  if (btnPortals && portalsMenu) {
    btnPortals.addEventListener('click', (e) => {
      e.stopPropagation();
      portalsMenu.classList.toggle('is-visible');
      audioEngine.playClick();
    });

    document.addEventListener('click', (e) => {
      if (!btnPortals.contains(e.target) && !portalsMenu.contains(e.target)) {
        portalsMenu.classList.remove('is-visible');
      }
    });
  }

  // Setup Nav Links smooth scrolling
  const navLinks = document.querySelectorAll('.hud-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      audioEngine.playClick();
      const targetId = link.getAttribute('href').substring(1);
      if (targetId === 'showcase-section') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          document.body.classList.remove('timeline-unlocked');
        }, 400);
        return;
      }

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        // Unlock timeline body scroll
        if (!document.body.classList.contains('timeline-unlocked')) {
          document.body.classList.add('timeline-unlocked');
        }
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      }
    });
  });
}
