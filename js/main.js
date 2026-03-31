// ===== AOS.js 初期化 =====
// スクロールトリガーアニメーションを有効化
// once: true で一度再生したら再度発火しない（パフォーマンス配慮）
AOS.init({
  duration: 700,
  easing: 'ease-out',
  once: true,
  offset: 60,
});

// ===== ナビゲーション: スクロール時の背景切り替え =====
// スクロール量が一定を超えたら .scrolled クラスを付与
const nav = document.getElementById('nav');

function handleNavScroll() {
  if (window.scrollY > 20) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}

// passive: true でスクロールパフォーマンスを最適化
window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll(); // 初期表示時にも判定

// ===== ハンバーガーメニュー =====
const hamburger = document.getElementById('hamburger');
const drawer    = document.getElementById('drawer');

hamburger.addEventListener('click', () => {
  const isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open');
  hamburger.classList.toggle('active');
  hamburger.setAttribute('aria-expanded', String(!isOpen));
  drawer.setAttribute('aria-hidden', String(isOpen));
});

// ドロワー内のリンクをクリックしたらメニューを閉じる
drawer.querySelectorAll('.nav__drawer-link').forEach(link => {
  link.addEventListener('click', () => {
    drawer.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  });
});

// ===== チャットボットウィジェット =====
// Claude API (/api/chat) と通信してリアルタイムに回答するチャットUI

const chatWidget     = document.getElementById('chatWidget');
const chatToggle     = document.getElementById('chatToggle');
const chatPanel      = document.getElementById('chatPanel');
const chatMessages   = document.getElementById('chatMessages');
const chatInput      = document.getElementById('chatInput');
const chatSend       = document.getElementById('chatSend');
const contactChatBtn = document.getElementById('contactChatBtn');

// 会話履歴を保持（Claude API の messages 形式）
let conversationHistory = [];
let chatOpened = false;

// チャットパネルの開閉トグル
function toggleChat(open) {
  const shouldOpen = (open !== undefined) ? open : !chatWidget.classList.contains('open');
  chatWidget.classList.toggle('open', shouldOpen);
  chatPanel.setAttribute('aria-hidden', String(!shouldOpen));
  chatToggle.setAttribute('aria-label', shouldOpen ? 'チャットを閉じる' : 'チャットを開く');

  // 初回オープン時にウェルカムメッセージを表示
  if (shouldOpen && !chatOpened) {
    chatOpened = true;
    setTimeout(() => {
      addBotMessage('こんにちは！橘 凛のポートフォリオサイトへようこそ。\nサービス内容・料金・ご依頼方法など、何でもお気軽にどうぞ。');
      enableInput();
    }, 300);
  }
}

chatToggle.addEventListener('click', () => toggleChat());

// Contact セクションの「チャットで話しかける」ボタンからも開ける
if (contactChatBtn) {
  contactChatBtn.addEventListener('click', () => toggleChat(true));
}

// ===== メッセージ追加ヘルパー =====

// ユーザーのメッセージをバブルとして追加
function addUserMessage(text) {
  const el = document.createElement('div');
  el.className = 'chat-message chat-message--user';
  el.textContent = text;
  chatMessages.appendChild(el);
  scrollToBottom();
}

// タイピングドットを表示し、Promiseで実際のメッセージバブルを返す
function addBotMessage(text) {
  const el = document.createElement('div');
  el.className = 'chat-message chat-message--bot';
  // 改行文字を <br> に変換して表示
  el.innerHTML = text.replace(/\n/g, '<br>');
  chatMessages.appendChild(el);
  scrollToBottom();
}

// 「入力中...」ドットアニメーション要素を追加して要素自体を返す
function showTypingIndicator() {
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typing);
  scrollToBottom();
  return typing;
}

// メッセージ一覧を最下部にスクロール
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 入力欄を有効化してフォーカス
function enableInput() {
  chatInput.disabled = false;
  chatSend.disabled  = false;
  chatInput.focus();
}

// 入力欄を無効化（APIリクエスト中など）
function disableInput() {
  chatInput.disabled = true;
  chatSend.disabled  = true;
}

// ===== Claude API 呼び出し =====
// ユーザーの入力を送信し、AIの返答をチャットに表示する

async function sendMessageToAPI(userText) {
  // 会話履歴にユーザーメッセージを追加
  conversationHistory.push({ role: 'user', content: userText });

  // タイピングインジケーターを表示
  const typingEl = showTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply || '（返答を取得できませんでした）';

    // 会話履歴にアシスタントの返答を追加
    conversationHistory.push({ role: 'assistant', content: reply });

    // タイピングドットを取り除いて実際のメッセージを表示
    typingEl.remove();
    addBotMessage(reply);

  } catch (err) {
    console.error('API エラー:', err);
    typingEl.remove();
    addBotMessage('申し訳ありません、通信エラーが発生しました。\nしばらくしてからお試しください。');
    // エラー時は送信したメッセージを履歴から除去（リトライを可能にする）
    conversationHistory.pop();
  }
}

// ===== ユーザー入力の処理 =====

async function handleUserInput() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  addUserMessage(text);
  disableInput();

  await sendMessageToAPI(text);

  enableInput();
}

// 送信ボタンのクリックイベント
chatSend.addEventListener('click', handleUserInput);

// Enter キーで送信（Shift+Enter は改行として保持）
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleUserInput();
  }
});
