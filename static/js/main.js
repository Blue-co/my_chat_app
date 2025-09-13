document.addEventListener('DOMContentLoaded', () => {
    // Socket.IO 클라이언트 연결 (현재 웹 서버 주소로 연결)
    var socket = io.connect('http://' + document.domain + ':' + location.port);

    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const usernameInput = document.getElementById('usernameInput');
    const sendMessageButton = document.getElementById('sendMessageButton');

    // 서버로부터 'response' 이벤트를 받았을 때 (새 메시지가 왔을 때)
    socket.on('response', function(data) {
        const messageElement = document.createElement('p');
        messageElement.classList.add('message-item');
        // 사용자 이름이 있으면 같이 표시
        if (data.username) {
            messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
        } else {
            messageElement.textContent = data.message;
        }
        messagesDiv.appendChild(messageElement);
        // 최신 메시지가 보이도록 스크롤 아래로 내리기
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // 서버로부터 'status' 이벤트를 받았을 때 (연결/끊김 알림 등)
    socket.on('status', function(data) {
        const statusElement = document.createElement('p');
        statusElement.classList.add('status-message');
        statusElement.textContent = data.msg;
        messagesDiv.appendChild(statusElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });


    // 메시지 전송 함수
    function sendMessage() {
        const message = messageInput.value.trim();
        const username = usernameInput.value.trim(); // 닉네임 가져오기

        if (message) {
            // 'message' 이벤트로 서버에 메시지와 닉네임 전송
            socket.emit('message', { message: message, username: username });
            messageInput.value = ''; // 입력창 초기화
            messageInput.focus(); // 입력창에 다시 포커스
        }
    }

    // '전송' 버튼 클릭 시 메시지 전송
    sendMessageButton.addEventListener('click', sendMessage);

    // Enter 키를 눌렀을 때 메시지 전송
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
단계 3: 로컬에서 
