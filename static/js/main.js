document.addEventListener('DOMContentLoaded', () => {
    // Socket.IO 클라이언트 연결 - 프로덕션 환경 호환 개선
    // 현재 위치에서 자동으로 서버 주소 감지
    const socket = io({
        // 재연결 설정
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true
    });
    
    // DOM 요소들
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const usernameInput = document.getElementById('usernameInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    
    // 메시지 표시 함수 개선
    function displayMessage(data, isStatus = false) {
        const messageElement = document.createElement('div');
        
        if (isStatus) {
            messageElement.classList.add('message', 'status');
            messageElement.innerHTML = `
                <div style="text-align: center; font-style: italic; color: #666;">
                    ${escapeHtml(data.msg)}
                    ${data.user_count ? ` (현재 ${data.user_count}명 접속)` : ''}
                </div>
            `;
        } else {
            messageElement.classList.add('message');
            messageElement.innerHTML = `
                <div class="username">${escapeHtml(data.username)}</div>
                <div class="message-text">${escapeHtml(data.message)}</div>
                ${data.timestamp ? `<div class="timestamp">${data.timestamp}</div>` : ''}
            `;
        }
        
        messagesDiv.appendChild(messageElement);
        
        // 스크롤을 최신 메시지로 이동
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // 메시지 개수 제한 (성능 최적화)
        const messages = messagesDiv.children;
        if (messages.length > 100) {
            messagesDiv.removeChild(messages[0]);
        }
    }
    
    // HTML 이스케이프 함수 (XSS 방지)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 메시지 전송 함수 개선
    function sendMessage() {
        const message = messageInput.value.trim();
        const username = usernameInput.value.trim();
        
        // 메시지 유효성 검사
        if (!message) {
            messageInput.focus();
            return;
        }
        
        if (message.length > 500) {
            alert('메시지가 너무 깁니다. (최대 500자)');
            return;
        }
        
        // 닉네임 길이 제한
        const finalUsername = username.length > 20 ? username.substring(0, 20) : username;
        
        // 서버에 메시지 전송
        socket.emit('message', {
            message: message,
            username: finalUsername || `Guest-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        });
        
        // 입력창 초기화 및 포커스
        messageInput.value = '';
        messageInput.focus();
    }
    
    // 이벤트 리스너들
    sendMessageButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 닉네임 입력 시 Enter 키로 메시지 입력창으로 이동
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            messageInput.focus();
        }
    });
    
    // Socket.IO 이벤트 처리
    
    // 연결 성공
    socket.on('connect', function() {
        console.log('서버에 연결되었습니다. ID:', socket.id);
        displayMessage({
            msg: '서버에 연결되었습니다! 채팅을 시작하세요. 🎉'
        }, true);
        
        // 사용자 목록 요청
        socket.emit('get_users');
    });
    
    // 연결 해제
    socket.on('disconnect', function(reason) {
        console.log('서버와의 연결이 끊어졌습니다. 이유:', reason);
        displayMessage({
            msg: '서버와의 연결이 끊어졌습니다. 재연결을 시도합니다... 🔄'
        }, true);
    });
    
    // 재연결 시도
    socket.on('reconnect_attempt', function(attemptNumber) {
        console.log('재연결 시도 중...', attemptNumber);
        displayMessage({
            msg: `재연결 시도 중... (${attemptNumber}번째)`
        }, true);
    });
    
    // 재연결 성공
    socket.on('reconnect', function() {
        console.log('서버에 재연결되었습니다.');
        displayMessage({
            msg: '서버에 다시 연결되었습니다! 💚'
        }, true);
        
        // 재연결 후 사용자 목록 다시 요청
        socket.emit('get_users');
    });
    
    // 재연결 실패
    socket.on('reconnect_failed', function() {
        console.log('재연결에 실패했습니다.');
        displayMessage({
            msg: '서버 재연결에 실패했습니다. 페이지를 새로고침해주세요. ❌'
        }, true);
    });
    
    // 메시지 수신
    socket.on('response', function(data) {
        displayMessage(data);
    });
    
    // 상태 메시지 수신 (입장/퇴장 등)
    socket.on('status', function(data) {
        displayMessage(data, true);
    });
    
    // 사용자 목록 수신
    socket.on('user_list', function(data) {
        console.log('현재 접속자:', data.users);
        // 필요시 사용자 목록 UI 업데이트 로직 추가
    });
    
    // 에러 처리
    socket.on('error', function(error) {
        console.error('소켓 에러:', error);
        displayMessage({
            msg: error.msg || '알 수 없는 오류가 발생했습니다.'
        }, true);
    });
    
    // 연결 오류 처리
    socket.on('connect_error', function(error) {
        console.error('연결 오류:', error);
        displayMessage({
            msg: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요. ❌'
        }, true);
    });
    
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', function() {
        socket.disconnect();
    });
    
    // 페이지 로드 완료 시 메시지 입력창에 포커스
    window.addEventListener('load', function() {
        messageInput.focus();
    });
    
    // 페이지 가시성 변경 감지 (브라우저 탭 전환 등)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // 페이지가 다시 활성화되면 메시지 입력창에 포커스
            setTimeout(() => {
                messageInput.focus();
            }, 100);
        }
    });
});
