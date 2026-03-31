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
// お問い合わせフォームの代替として機能するチャットUI
// 会話フローは状態マシンで管理: greeting → name → message → email → done

const chatWidget  = document.getElementById('chatWidget');
const chatToggle  = document.getElementById('chatToggle');
const chatPanel   = document.getElementById('chatPanel');
const chatMessages = document.getElementById('chatMessages');
const chatInput   = document.getElementById('chatInput');
const chatSend    = document.getElementById('chatSend');
const contactChatBtn = document.getElementById('contactChatBtn');

// 会話の状態: 名前 → メッセージ → メール → 完了
let chatState = 'idle';
let userName  = '';

// チャットパネルの開閉トグル
function toggleChat(open) {
  const shouldOpen = (open !== undefined) ? open : !chatWidget.classList.contains('open');
  chatWidget.classList.toggle('open', shouldOpen);
  chatPanel.setAttribute('aria-hidden', String(!shouldOpen));
  chatToggle.setAttribute('aria-label', shouldOpen ? 'チャットを閉じる' : 'チャットを開く');

  // 初回オープン時にウェルカムメッセージを表示
  if (shouldOpen && chatState === 'idle') {
    chatState = 'greeting';
    setTimeout(() => addBotMessage('こんにちは！👋 橘 凛へのお問い合わせページへようこそ。'), 300);
    setTimeout(() => addBotMessage('まず、お名前を教えていただけますか？'), 1100);
    setTimeout(() => {
      chatState = 'name';
      enableInput();
    }, 1100);
  }
}

chatToggle.addEventListener('click', () => toggleChat());

// Contact セクションの「チャットで話しかける」ボタンからも開ける
if (contactChatBtn) {
  contactChatBtn.addEventListener('click', () => {
    toggleChat(true);
    // パネルが画面外の場合はスクロール不要なのでそのまま開く
  });
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

// ボットの「入力中...」インジケーターを表示してからメッセージを追加
function addBotMessage(text, delay = 0) {
  // タイピングドットを表示
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typing);
  scrollToBottom();

  // 一定時間後に実際のメッセージに差し替える
  setTimeout(() => {
    typing.remove();
    const el = document.createElement('div');
    el.className = 'chat-message chat-message--bot';
    el.textContent = text;
    chatMessages.appendChild(el);
    scrollToBottom();
  }, 800 + delay);
}

// メッセージ一覧を最下部にスクロール
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 入力欄を有効化してフォーカス
function enableInput() {
  chatInput.disabled  = false;
  chatSend.disabled   = false;
  chatInput.focus();
}

// 入力欄を無効化（ボットが返信中など）
function disableInput() {
  chatInput.disabled = true;
  chatSend.disabled  = true;
}

// ===== 会話フローの処理 =====
// 状態に応じてユーザーの入力を解釈し次の質問へ進む

function handleUserInput() {
  const text = chatInput.value.trim();
  if (!text) return;

  // 入力欄をクリア
  chatInput.value = '';
  addUserMessage(text);
  disableInput();

  // 状態ごとに処理を分岐
  switch (chatState) {

    case 'name':
      // 名前を保存して次の質問へ
      userName = text;
      setTimeout(() => {
        addBotMessage(`ありがとうございます、${userName}さん！`);
        setTimeout(() => {
          addBotMessage('どのようなご用件でしょうか？お気軽にどうぞ。');
          setTimeout(() => {
            chatState = 'message';
            enableInput();
          }, 900);
        }, 900);
      }, 800);
      break;

    case 'message':
      // メッセージを受け取りメールアドレスを聞く
      setTimeout(() => {
        addBotMessage('承りました！');
        setTimeout(() => {
          addBotMessage('返信先のメールアドレスを教えていただけますか？（任意・スキップ可）');
          setTimeout(() => {
            chatState = 'email';
            chatInput.placeholder = 'メールアドレス（任意）';
            enableInput();
          }, 900);
        }, 900);
      }, 800);
      break;

    case 'email':
      // メールアドレスの有無に関わらず完了メッセージを表示
      const hasEmail = text !== 'スキップ' && text.includes('@');
      const replyMsg = hasEmail
        ? `${text} 宛にご連絡いたします。`
        : '後ほど改めてご連絡いたします。';

      setTimeout(() => {
        addBotMessage(`ありがとうございます！${replyMsg}`);
        setTimeout(() => {
          addBotMessage(`${userName}さんからのお問い合わせ、楽しみにしています。近日中にご返信いたします 🙏`);
          chatState = 'done';
          chatInput.placeholder = 'お問い合わせを受け付けました';
          // 完了後は入力を無効化
        }, 1000);
      }, 800);
      break;

    default:
      break;
  }
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
