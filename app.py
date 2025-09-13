from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

# Flask 애플리케이션 초기화
app = Flask(__name__)
# 보안을 위한 SECRET_KEY! 꼭 너만의 랜덤 문자열로 바꿔줘. 배포할 때는 환경변수로 관리하는 게 더 좋아!
app.config['SECRET_KEY'] = '너만의_아무도_모르는_비밀_키_넣어줘_진짜_중요함'
socketio = SocketIO(app)

# 기본 웹 페이지 라우트
@app.route('/')
def index():
    return render_template('index.html')

# 클라이언트가 연결되었을 때
@socketio.on('connect')
def handle_connect():
    print(f'클라이언트 연결됨: {request.sid}')
    emit('status', {'msg': f'{request.sid}가 입장했어요.'}, broadcast=True)

# 클라이언트로부터 메시지를 받았을 때
@socketio.on('message')
def handle_message(data):
    print(f'수신 메시지 from {request.sid}: {data}')
    # 받은 메시지를 모든 연결된 클라이언트에게 전송 (broadcast)
    # 'response' 이벤트로 보낼 거야.
    emit('response', {
        'message': data['message'],
        'username': data.get('username', f'Guest-{request.sid[:4]}') # 유저 이름 없으면 Guest-XXXX 로 표시
    }, broadcast=True)

# 클라이언트 연결이 끊어졌을 때
@socketio.on('disconnect')
def handle_disconnect():
    print(f'클라이언트 연결 끊김: {request.sid}')
    emit('status', {'msg': f'{request.sid}가 퇴장했어요.'}, broadcast=True)

# 앱 실행
if __name__ == '__main__':
    # debug=True는 개발 시에만 사용! 배포 시에는 반드시 꺼야 해.
    # socketio.run은 eventlet 웹 서버를 사용해.
    socketio.run(app, debug=True, port=5000)
