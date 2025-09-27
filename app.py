from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import os

# Flask 애플리케이션 초기화
app = Flask(__name__)

# 보안을 위한 SECRET_KEY - 환경변수 우선, 없으면 기본값 사용
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-production-secret-key-change-this-in-production')

# SocketIO 초기화 - 배포용 설정 개선
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",  # CORS 허용 (필요시 특정 도메인으로 제한)
    async_mode='eventlet',     # eventlet 사용 명시 (gunicorn과 호환)
    logger=True,               # 로깅 활성화
    engineio_logger=True       # Engine.IO 로깅 활성화
)

# 애플리케이션 컨텍스트 내에서 전역 변수 초기화
with app.app_context():
    # 연결된 사용자 추적용 딕셔너리
    connected_users = {}

# 기본 웹 페이지 라우트
@app.route('/')
def index():
    return render_template('index.html')

# 헬스체크 엔드포인트 추가 (배포 환경에서 유용)
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'service': 'chat-app'}, 200

# 클라이언트가 연결되었을 때
@socketio.on('connect')
def handle_connect():
    user_id = request.sid
    print(f'클라이언트 연결됨: {user_id}')
    
    # 연결된 사용자 정보 저장
    connected_users[user_id] = {
        'id': user_id,
        'nickname': None,
        'connected_at': request.event.get('timestamp', 'unknown')
    }
    
    # 입장 메시지 브로드캐스트
    emit('status', {
        'msg': f'새로운 사용자가 입장했습니다! 👋',
        'type': 'join',
        'user_count': len(connected_users)
    }, broadcast=True)

# 클라이언트로부터 메시지를 받았을 때
@socketio.on('message')
def handle_message(data):
    user_id = request.sid
    print(f'수신 메시지 from {user_id}: {data}')
    
    # 데이터 유효성 검사 강화
    if not data or not isinstance(data, dict) or 'message' not in data:
        emit('error', {'msg': '잘못된 메시지 형식입니다.'})
        return
    
    message = data.get('message', '').strip()
    if not message:
        return
    
    # 메시지 길이 제한
    if len(message) > 500:
        emit('error', {'msg': '메시지가 너무 깁니다. (최대 500자)'})
        return
    
    username = data.get('username', '').strip()
    if not username:
        username = f'Guest-{user_id[:8]}'
    
    # 사용자 정보 업데이트
    if user_id in connected_users:
        connected_users[user_id]['nickname'] = username
    
    # HTML 이스케이프 처리 (XSS 방지)
    message = message.replace('<', '&lt;').replace('>', '&gt;')
    username = username.replace('<', '&lt;').replace('>', '&gt;')
    
    # 받은 메시지를 모든 연결된 클라이언트에게 전송
    emit('response', {
        'message': message,
        'username': username,
        'timestamp': data.get('timestamp', ''),
        'user_id': user_id[:8]  # 식별용 짧은 ID
    }, broadcast=True)

# 클라이언트 연결이 끊어졌을 때
@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    print(f'클라이언트 연결 끊김: {user_id}')
    
    # 연결된 사용자 목록에서 제거
    user_info = connected_users.pop(user_id, None)
    
    # 퇴장 메시지 브로드캐스트
    if user_info:
        nickname = user_info.get('nickname', f'Guest-{user_id[:8]}')
        emit('status', {
            'msg': f'{nickname}님이 퇴장했습니다. 👋',
            'type': 'leave',
            'user_count': len(connected_users)
        }, broadcast=True)

# 사용자 목록 요청 처리
@socketio.on('get_users')
def handle_get_users():
    user_list = []
    for user_id, user_info in connected_users.items():
        user_list.append({
            'id': user_id[:8],
            'nickname': user_info.get('nickname', f'Guest-{user_id[:8]}')
        })
    
    emit('user_list', {'users': user_list, 'count': len(user_list)})

# 에러 핸들링 강화
@socketio.on_error_default
def default_error_handler(e):
    print(f'SocketIO 에러: {e}')
    emit('error', {'msg': '서버에서 오류가 발생했습니다.'})

# 커스텀 에러 핸들링
@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal server error'}, 500

# 앱 실행 부분 수정
if __name__ == '__main__':  # 오타 수정: **name** -> __name__
    # 개발 환경에서만 실행
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 개발 서버 시작 - 포트: {port}")
    socketio.run(
        app, 
        host='0.0.0.0',
        port=port,
        debug=debug_mode,
        use_reloader=False  # eventlet과 호환성을 위해 reloader 비활성화
    )
