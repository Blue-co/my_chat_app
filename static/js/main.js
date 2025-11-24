// DOM이 완전히 로드된 후에만 실행
document.addEventListener('DOMContentLoaded', () => {
    // 중복 실행 방지
    if (window.chatAppInitialized) {
        console.log('채팅앱이 이미 초기화되었습니다.');
        return;
    }
    window.chatAppInitialized = true;
    
    console.log('채팅앱 초기화 중...');
    
    // Socket.IO 클라이언트 연결 - 프로덕션 환경 호환
    const socket = io({
        reconnection: true,
        reconnectionDelay: 500,
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
    const connectionStatus = document.getElementById('connectionStatus');
    
    // 현재 사용자 정보 저장
    let currentUser = {
        nickname: '',
        isNicknameSet: false
    };
    
    // 연결 상태 업데이트 함수
    function updateConnectionStatus(status) {
        if (connectionStatus) {
            connectionStatus.className = `connection-status ${status}`;
        }
    }
    function displayStatus() {
        const userNum = document.getElementById('UN');

        userNum.innerHTML = `유저 : ${date.user_count}명`;
    }
    
    // 메시지 표시 함수 개선
    function displayMessage(data, isStatus = false) {
        const messageElement = document.createElement('div');
        
        if (isStatus) {
            messageElement.classList.add('message', 'status');
            messageElement.innerHTML = `
                <div class='usersObjectNum' style="text-align: center; font-style: italic; color: #666;">
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
        if (messages.length > 500) {
            messagesDiv.removeChild(messages[0]);
        }

        setTimeout(() => {
            const bubble = document.querySelector('.message.status');
            if (bubble) {
                bubble.style.display = 'none';
            }
        }, 3000)
        
        setTimeout(() => {
            const usersN = document.querySelector('.usersObjectNum');
            if (usersN) {
                usersN.style.display = 'none';
            }
        }, 3000)
    }
    
    // HTML 이스케이프 함수 (XSS 방지)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
    
    // 닉네임 유효성 검사 및 설정
    function setUserNickname() {
        const inputNickname = usernameInput.value.trim();
        
        if (inputNickname && inputNickname.length > 0) {
            // 닉네임 길이 제한
            currentUser.nickname = inputNickname.length > 20 ? inputNickname.substring(0, 20) : inputNickname;
            currentUser.isNicknameSet = true;
            
            // 닉네임 설정 확인 메시지
            console.log('닉네임 설정:', currentUser.nickname);
            
            // 닉네임 입력창 스타일 변경 (설정됨을 표시)
            usernameInput.style.backgroundColor = '#e8f5e8';
            usernameInput.title = `현재 닉네임: ${currentUser.nickname}`;
        } else {
            // 닉네임이 비어있으면 랜덤 생성
            currentUser.nickname = `user${Math.random().toString(36).substr(2, 4)}`;
            currentUser.isNicknameSet = false;
            
            usernameInput.style.backgroundColor = '';
            usernameInput.title = '';
        }
        
        return currentUser.nickname;
    }
    
    // 메시지 전송 함수 개선
    function sendMessage() {
        const message = messageInput.value.trim();
        
        // 메시지 유효성 검사
        if (!message) {
            messageInput.focus();
            return;
        }
        
        if (message.length > 500) {
            alert('메시지가 너무 깁니다. (최대 500자)');
            return;
        }
        
        // 닉네임 설정 (메시지 전송 시마다 확인)
        const finalUsername = setUserNickname();
        
        // 서버에 메시지 전송
        const messageData = {
            message: message,
            username: finalUsername,
            timestamp: new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        };
        
        console.log('메시지 전송:', messageData);
        socket.emit('message', messageData);
        
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
            setUserNickname(); // 닉네임 즉시 설정
            messageInput.focus();
        }
    });
    
    // 닉네임 입력창에서 포커스 잃을 때 닉네임 설정
    usernameInput.addEventListener('blur', function() {
        setUserNickname();
    });
    
    // Socket.IO 이벤트 처리 (중복 방지)
    
    // 연결 성공
    socket.on('connect', function() {
        console.log('서버에 연결되었습니다. ID:', socket.id);
        updateConnectionStatus('');
        displayMessage({
            msg: '서버에 연결되었습니다! 채팅을 시작하세요. 🎉'
        }, true);
        
        // 사용자 목록 요청
        socket.emit('get_users');
    });
    
    // 연결 해제
    socket.on('disconnect', function(reason) {
        console.log('서버와의 연결이 끊어졌습니다. 이유:', reason);
        updateConnectionStatus('disconnected');
        displayMessage({
            msg: '서버와의 연결이 끊어졌습니다. 재연결을 시도합니다... 🔄'
        }, true);
    });
    
    // 재연결 시도
    socket.on('reconnect_attempt', function(attemptNumber) {
        console.log('재연결 시도 중...', attemptNumber);
        updateConnectionStatus('connecting');
        displayMessage({
            msg: `재연결 시도 중... (${attemptNumber}번째)`
        }, true);
    });
    
    // 재연결 성공
    socket.on('reconnect', function() {
        console.log('서버에 재연결되었습니다.');
        updateConnectionStatus('');
        displayMessage({
            msg: '서버에 다시 연결되었습니다! 💚'
        }, true);
        
        // 재연결 후 사용자 목록 다시 요청
        socket.emit('get_users');
    });
    
    // 재연결 실패
    socket.on('reconnect_failed', function() {
        console.log('재연결에 실패했습니다.');
        updateConnectionStatus('disconnected');
        displayMessage({
            msg: '서버 재연결에 실패했습니다. 페이지를 새로고침해주세요. ❌'
        }, true);
    });
    
    // 메시지 수신 (중복 방지를 위해 한 번만 등록)
    socket.on('response', function(data) {
        console.log('메시지 수신:', data);
        displayMessage(data);
    });
    
    // 상태 메시지 수신 (입장/퇴장 등)
    socket.on('status', function(data) {
        console.log('상태 메시지:', data);
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
            msg: error.msg || '헉... 알 수 없는 오류!.'
        }, true);
    });
    
    // 연결 오류 처리
    socket.on('connect_error', function(error) {
        console.error('연결 오류:', error);
        updateConnectionStatus('disconnected');
        displayMessage({
            msg: '서버 연결 안돼네ㅠㅠ. 잠시 후 다시 시도해보자!'
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
    
    // 초기화 완료 메시지
    console.log('채팅앱 초기화 완료!');
});
