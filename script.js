const configForm = document.getElementById('configForm');
const contactName = document.getElementById('contactName');
const contactPhone = document.getElementById('contactPhone');
const contactStatus = document.getElementById('contactStatus');
const incomingMessage = document.getElementById('incomingMessage');
const outgoingMessage = document.getElementById('outgoingMessage');
const composerInput = document.getElementById('composerInput');
const sendBtn = document.getElementById('sendBtn');
const chatBody = document.getElementById('chatBody');
const editorSheet = document.getElementById('editorSheet');
const editToggle = document.getElementById('editToggle');
const closeEditor = document.getElementById('closeEditor');
const openProfileBtn = document.getElementById('openProfile');
const closeProfileBtn = document.getElementById('closeProfile');
const chatScreen = document.getElementById('chatScreen');
const profileScreen = document.getElementById('profileScreen');

const STORAGE_KEY = 'whatsapp-mobile-clone-data';

const defaultOutgoingMessages = [
  'Halo, saya dari JNT. Saya mau cek status paket saya.',
  'Mohon bantu cek paket saya yang masih dalam perjalanan.',
  'Terima kasih, saya tunggu update selanjutnya.'
];

const defaultIncomingMessages = [
  'Halo, terima kasih sudah menghubungi kami. Ada yang bisa kami bantu?',
  'Baik, saya cek status pengiriman Anda sekarang.',
  'Siap, paket sedang diproses dan akan segera dikirimkan.'
];

function normalizeMessages(saved, fallback) {
  if (Array.isArray(saved) && saved.length) return saved.filter((item) => typeof item === 'string' && item.trim());
  if (typeof saved === 'string' && saved.trim()) return [saved.trim()];
  return fallback;
}

function getInitials(name) {
  const safeName = (name || 'Kontak').trim();
  if (!safeName) return 'K';
  const parts = safeName.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'K';
}

function getAccentFromPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  const lastDigit = digits ? Number(digits.slice(-1)) : 0;
  const palette = [
    'linear-gradient(135deg, #93c5fd, #2563eb)',
    'linear-gradient(135deg, #f9a8d4, #ec4899)',
    'linear-gradient(135deg, #86efac, #16a34a)',
    'linear-gradient(135deg, #fcd34d, #f59e0b)',
    'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
    'linear-gradient(135deg, #fca5a5, #ef4444)'
  ];
  return palette[lastDigit % palette.length];
}

function saveState() {
  const data = {
    name: contactName.value,
    phone: contactPhone.value,
    status: contactStatus.value,
    incoming: incomingMessage.value,
    outgoing: outgoingMessage.value,
    incomingMessages: normalizeMessages([], defaultIncomingMessages),
    outgoingMessages: normalizeMessages([], defaultOutgoingMessages)
  };

  if (incomingMessage.value.trim()) data.incomingMessages = [incomingMessage.value.trim(), ...defaultIncomingMessages.slice(1)];
  if (outgoingMessage.value.trim()) data.outgoingMessages = [outgoingMessage.value.trim(), ...defaultOutgoingMessages.slice(1)];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    contactName.value = 'Customer JNT';
    contactPhone.value = '+6282229509095';
    contactStatus.value = 'Online';
    incomingMessage.value = defaultIncomingMessages[0];
    outgoingMessage.value = defaultOutgoingMessages[0];
    saveState();
    return;
  }

  try {
    const data = JSON.parse(raw);
    const isLegacyPreset =
      (data.name || '').trim() === 'Riyan' ||
      (data.outgoing || '').trim() === 'Halo juga, ini contoh pesan saya.' ||
      (data.incoming || '').trim() === 'Halo, ini contoh pesan yang masuk dari customer.';

    const fallbackName = isLegacyPreset ? 'Customer JNT' : (data.name || 'Customer JNT');
    const fallbackPhone = isLegacyPreset ? '+6282229509095' : (data.phone || '+6282229509095');
    const fallbackStatus = isLegacyPreset ? 'Online' : (data.status || 'Online');

    contactName.value = fallbackName;
    contactPhone.value = fallbackPhone;
    contactStatus.value = fallbackStatus;

    const savedIncoming = normalizeMessages(data.incomingMessages || data.incoming, defaultIncomingMessages);
    const savedOutgoing = normalizeMessages(data.outgoingMessages || data.outgoing, defaultOutgoingMessages);

    incomingMessage.value = isLegacyPreset ? defaultIncomingMessages[0] : (savedIncoming[0] || defaultIncomingMessages[0]);
    outgoingMessage.value = isLegacyPreset ? defaultOutgoingMessages[0] : (savedOutgoing[0] || defaultOutgoingMessages[0]);

    if (isLegacyPreset) {
      saveState();
    }
  } catch (error) {
    console.warn('Failed to parse saved chat data', error);
    contactName.value = 'Customer JNT';
    contactPhone.value = '+6282229509095';
    contactStatus.value = 'Online';
    incomingMessage.value = defaultIncomingMessages[0];
    outgoingMessage.value = defaultOutgoingMessages[0];
    saveState();
  }
}

function updateProfile() {
  const name = contactName.value.trim() || 'Kontak';
  const phone = contactPhone.value.trim() || '+62xxxxxxxxxx';
  const status = contactStatus.value.trim() || 'Online';
  const initials = getInitials(name);
  const accent = getAccentFromPhone(phone);

  document.getElementById('chatName').textContent = name;
  document.getElementById('chatStatus').textContent = status;
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileNameInline').textContent = name;
  document.getElementById('profilePhone').textContent = phone;
  document.getElementById('profilePhoneInline').textContent = phone;
  document.getElementById('profileStatus').textContent = status;

  document.querySelectorAll('.avatar, .profile-avatar').forEach((avatar) => {
    avatar.textContent = initials;
    avatar.style.background = accent;
  });
}

function createMessageBubble(text, type) {
  const wrap = document.createElement('div');
  wrap.className = `message ${type}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  const time = document.createElement('span');
  time.className = 'time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  wrap.appendChild(bubble);
  wrap.appendChild(time);
  return wrap;
}

function renderChat() {
  const outgoingSequence = normalizeMessages([
    outgoingMessage.value.trim() || defaultOutgoingMessages[0],
    ...defaultOutgoingMessages.slice(1)
  ], defaultOutgoingMessages);

  const incomingSequence = normalizeMessages([
    incomingMessage.value.trim() || defaultIncomingMessages[0],
    ...defaultIncomingMessages.slice(1)
  ], defaultIncomingMessages);

  chatBody.innerHTML = '<div class="date-pill">Hari ini</div>';

  const maxLength = Math.max(outgoingSequence.length, incomingSequence.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (outgoingSequence[index]) {
      chatBody.appendChild(createMessageBubble(outgoingSequence[index], 'outgoing'));
    }
    if (incomingSequence[index]) {
      chatBody.appendChild(createMessageBubble(incomingSequence[index], 'incoming'));
    }
  }

  composerInput.value = outgoingSequence[0] || defaultOutgoingMessages[0];
}

function openEditor() {
  editorSheet.classList.add('open');
}

function closeEditorSheet() {
  editorSheet.classList.remove('open');
}

function openProfile() {
  chatScreen.classList.remove('active');
  profileScreen.classList.add('active');
}

function closeProfile() {
  profileScreen.classList.remove('active');
  chatScreen.classList.add('active');
}

configForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveState();
  updateProfile();
  renderChat();
  closeEditorSheet();
  chatBody.scrollTop = chatBody.scrollHeight;
});

sendBtn.addEventListener('click', () => {
  const value = composerInput.value.trim();
  if (!value) return;

  chatBody.appendChild(createMessageBubble(value, 'outgoing'));
  outgoingMessage.value = value;
  saveState();
  composerInput.value = '';
  chatBody.scrollTop = chatBody.scrollHeight;
});

composerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendBtn.click();
  }
});

editToggle.addEventListener('click', openEditor);
closeEditor.addEventListener('click', closeEditorSheet);
openProfileBtn.addEventListener('click', openProfile);
closeProfileBtn.addEventListener('click', closeProfile);

loadState();
updateProfile();
renderChat();
