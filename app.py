from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import os

# Flask 애플리케이션 초기화
app = Flask(__name__)

# 보안을 위한 SECRET_KEY - 환경변수 우선, 없으면 기본값 사용
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-production-secret-key-change-this-in-production')

# SocketIO 초기화 - 배포용 설정 추가
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",  # CORS 허용 (필요시 특정 도메인으로 제한)
    async_mode='threading'      # threading 사용 명시
)

# 기본 웹 페이지 라우트
@app.route('/')
def index():
    return render_template('index.html')

# 클라이언트가 연결되었을 때
@socketio.on('connect')
def handle_connect():
    print(f'클라이언트 연결됨: {request.sid}')
    emit('status', {'msg': f'{request.sid[:8]}이 입장했어요.'}, broadcast=True)

# 클라이언트로부터 메시지를 받았을 때
@socketio.on('message')
def handle_message(data):
    print(f'수신 메시지 from {request.sid}: {data}')
    
    # 데이터 유효성 검사 추가
    if not data or 'message' not in data:
        return
    
    # 받은 메시지를 모든 연결된 클라이언트에게 전송 (broadcast)
    emit('response', {
        'message': data['message'],
        'username': data.get('username', f'Guest-{request.sid[:4]}'),  # 유저 이름 없으면 Guest-XXXX로 표시
        'timestamp': data.get('timestamp', '')  # 타임스탬프 추가 (선택사항)
    }, broadcast=True)

# 클라이언트 연결이 끊어졌을 때
@socketio.on('disconnect')
def handle_disconnect():
    print(f'클라이언트 연결 끊김: {request.sid}')
    emit('status', {'msg': f'{request.sid[:8]}이 퇴장했어요.'}, broadcast=True)

# 에러 핸들링 추가
@socketio.on_error_default
def default_error_handler(e):
    print(f'SocketIO 에러: {e}')

# 앱 실행
if __name__ == '__main__':
    # 배포용 설정: 환경변수에서 PORT 가져오기
    port = int(os.environ.get('PORT', 5000))
    
    # 개발/배포 환경 구분
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    # socketio.run으로 실행 - 배포용 설정
    socketio.run(
        app, 
        host='0.0.0.0',        # 모든 IP에서 접근 가능 (배포 필수)
        port=port,             # 환경변수 PORT 사용
        debug=debug_mode       # 개발 환경에서만 디버그 모드
    )
