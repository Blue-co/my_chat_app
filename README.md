# 💬 푸링의 미니 채팅 웹앱 (Python & Flask-SocketIO)

친구들과 실시간으로 메시지를 주고받을 수 있는 나만의 미니 채팅 웹 애플리케이션입니다. Python의 Flask 프레임워크와 실시간 양방향 통신을 위한 Flask-SocketIO를 활용하여 개발되었습니다.

## ✨ 주요 기능

*   **실시간 메시징**: WebSocket을 통한 즉각적인 메시지 송수신.
*   **닉네임 지원**: 사용자 닉네임을 설정하여 메시지 전송.
*   **간단한 UI**: 직관적인 인터페이스로 쉽게 채팅 가능.
*   **Render.com 배포**: 무료 클라우드 플랫폼을 통해 접근성 확보.

## 🛠️ 기술 스택

*   **백엔드**: Python, Flask, Flask-SocketIO
*   **프론트엔드**: HTML5, CSS3, JavaScript
*   **실시간 통신**: WebSockets
*   **배포**: Render.com
*   **버전 관리**: Git, GitHub

## 🚀 시작하는 방법 (Local)

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계를 따르세요.

1.  **프로젝트 클론 (GitHub에서 받은 경우)**
    ```bash
    git clone https://github.com/YourGitHubUsername/my-chat-app.git
    cd my-chat-app
    ```
    (만약 GitHub에 올리기 전이라면 이 단계는 건너뛰고 2단계부터 진행)

2.  **가상 환경 설정**
    ```bash
    python -m venv venv
    # macOS/Linux
    source venv/bin/activate
    # Windows
    # venv\Scripts\activate
    ```

3.  **의존성 설치**
    ```bash
    pip install -r requirements.txt
    ```

4.  **애플리케이션 실행**
    ```bash
    python app.py
    ```
    브라우저에서 `http://127.0.0.1:5000/` 또는 `http://localhost:5000/` 로 접속하세요.

## ☁️ Render.com 배포 가이드

이 프로젝트는 Render.com을 통해 무료로 배포할 수 있습니다. 자세한 내용은 `Procfile`과 `requirements.txt` 파일을 참조하세요.
(주의: Render.com 무료 플랜은 일정 시간 미사용 시 슬립 모드에 진입하여 초기 로딩 시간이 길어질 수 있습니다.)

## 📝 라이선스

이 프로젝트는 [LICENSE_TYPE] 라이선스에 따라 배포됩니다. 자세한 내용은 [LICENSE.md](LICENSE.md) 파일을 참조하세요.
