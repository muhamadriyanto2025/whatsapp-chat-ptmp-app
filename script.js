const configForm = document.getElementById('configForm');
const contactName = document.getElementById('contactName');
const contactPhone = document.getElementById('contactPhone');
const contactStatus = document.getElementById('contactStatus');
const chatRowList = document.getElementById('chatRowList');
const addChatRowBtn = document.getElementById('addChatRow');
const composerInput = document.getElementById('composerInput');
const sendBtn = document.getElementById('sendBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
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

let chatEntries = [];

function getDefaultChatEntries() {
  return [];
}

function normalizeMessages(saved, fallback) {
  if (Array.isArray(saved) && saved.length) return saved.filter((item) => typeof item === 'string' && item.trim());
  if (typeof saved === 'string' && saved.trim()) return [saved.trim()];
  return fallback;
}

function normalizeChatEntries(saved) {
  if (!Array.isArray(saved)) return [];

  const cleaned = saved
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const type = entry.type === 'incoming' ? 'incoming' : 'outgoing';
      const text = typeof entry.text === 'string' ? entry.text.trim() : '';
      if (!text) return null;
      return { type, text };
    })
    .filter(Boolean);

  return cleaned;
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

function buildChatRow(entry, index) {
  const row = document.createElement('div');
  row.className = 'chat-row';
  row.dataset.index = String(index);

  const select = document.createElement('select');
  select.className = 'chat-role-select';
  select.innerHTML = `
    <option value="outgoing" ${entry.type === 'outgoing' ? 'selected' : ''}>Saya</option>
    <option value="incoming" ${entry.type === 'incoming' ? 'selected' : ''}>Customer</option>
  `;

  const textarea = document.createElement('textarea');
  textarea.className = 'chat-row-text';
  textarea.rows = 3;
  textarea.value = entry.text;
  textarea.placeholder = 'Tulis chat...';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'chat-row-remove';
  removeBtn.textContent = '✕';
  removeBtn.title = 'Hapus baris chat';
  removeBtn.addEventListener('click', () => {
    if (chatEntries.length <= 1) return;
    chatEntries.splice(index, 1);
    renderChatEditor(chatEntries);
  });

  row.appendChild(select);
  row.appendChild(textarea);
  row.appendChild(removeBtn);
  return row;
}

function renderChatEditor(entries) {
  const safeEntries = entries.length ? entries : [{ type: 'outgoing', text: '' }];
  chatRowList.innerHTML = '';

  safeEntries.forEach((entry, index) => {
    chatRowList.appendChild(buildChatRow(entry, index));
  });
}

function collectChatEntries() {
  const rows = [...chatRowList.querySelectorAll('.chat-row')];
  const entries = rows
    .map((row) => {
      const select = row.querySelector('.chat-role-select');
      const text = row.querySelector('.chat-row-text').value.trim();
      if (!text) return null;
      return { type: select.value, text };
    })
    .filter(Boolean);

  return entries;
}

function saveState() {
  const data = {
    name: contactName.value,
    phone: contactPhone.value,
    status: contactStatus.value,
    chatEntries: chatEntries.length ? chatEntries : []
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    contactName.value = 'Customer JNT';
    contactPhone.value = '+6282229509095';
    contactStatus.value = 'Online';
    chatEntries = [];
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

    const savedEntries = normalizeChatEntries(data.chatEntries || []);
    chatEntries = isLegacyPreset ? [] : savedEntries;

    if (isLegacyPreset) {
      saveState();
    }
  } catch (error) {
    console.warn('Failed to parse saved chat data', error);
    contactName.value = 'Customer JNT';
    contactPhone.value = '+6282229509095';
    contactStatus.value = 'Online';
    chatEntries = [];
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
  const entries = chatEntries.length ? chatEntries : [];
  chatBody.innerHTML = '<div class="date-pill">Hari ini</div>';

  entries.forEach((entry) => {
    if (entry && entry.text) {
      chatBody.appendChild(createMessageBubble(entry.text, entry.type));
    }
  });

  composerInput.value = '';
}

function insertEmojiIntoTarget(emoji) {
  const target = document.activeElement && document.activeElement.matches('input, textarea')
    ? document.activeElement
    : composerInput;

  if (!target) return;

  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  const current = target.value || '';

  target.value = `${current.slice(0, start)}${emoji}${current.slice(end)}`;
  const newPosition = start + emoji.length;
  target.focus();
  target.setSelectionRange(newPosition, newPosition);
}

function toggleEmojiPicker() {
  emojiPicker.classList.toggle('hidden');
}

function hideEmojiPicker() {
  emojiPicker.classList.add('hidden');
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

addChatRowBtn.addEventListener('click', () => {
  chatEntries = [...chatEntries, { type: 'outgoing', text: '' }];
  renderChatEditor(chatEntries);
});

emojiBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleEmojiPicker();
  composerInput.focus();
});

emojiPicker.addEventListener('click', (event) => {
  const emojiButton = event.target.closest('.emoji-option');
  if (!emojiButton) return;

  const emoji = emojiButton.dataset.emoji;
  if (!emoji) return;

  insertEmojiIntoTarget(emoji);
  hideEmojiPicker();
});

document.addEventListener('click', (event) => {
  if (!emojiPicker.contains(event.target) && !emojiBtn.contains(event.target)) {
    hideEmojiPicker();
  }
});

configForm.addEventListener('submit', (event) => {
  event.preventDefault();
  chatEntries = collectChatEntries();
  saveState();
  updateProfile();
  renderChat();
  closeEditorSheet();
  chatBody.scrollTop = chatBody.scrollHeight;
});

sendBtn.addEventListener('click', () => {
  const value = composerInput.value.trim();
  if (!value) return;

  chatEntries = [...chatEntries, { type: 'outgoing', text: value }];
  saveState();
  renderChatEditor(chatEntries);
  renderChat();
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
renderChatEditor(chatEntries);
updateProfile();
renderChat();
