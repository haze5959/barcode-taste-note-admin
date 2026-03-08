# Barcode Taste Note Admin

## 💡 개요
바코드 테이스트 노트 어드민(Admin) 웹페이지입니다.
- 관리 방향성
	- 중복되고 명칭이 확실한 제품은 머지
	- 사용자가 직접 등록한 제품인데 이름이 영어가 아닌경우에는 그냥 놔둔다
		- 직접 등록 제품은 왼만하면 건들지 않기
		- 같은 언어권끼리는 확실한 명칭인 제품인 경우 머지
	- 노트가 작성된 제품 우선으로 정리

## 🤖 AI 에이전트 사용법
"RULES.md를 먼저 읽고 시작해줘" 한마디 하고 시작!

## 🚀 시작하기

### 1. 환경 변수 설정
프로젝트 최상위 경로에 `.env` 파일을 생성하고 아래와 같이 Auth0 정보를 설정합니다:

```env
VITE_AUTH0_DOMAIN=your_auth0_domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
```

### 2. 패키지 설치
이 프로젝트는 의존성 검사를 우회하기 위해 `--legacy-peer-deps` 옵션을 필수로 사용해야 합니다.

```bash
npm install --legacy-peer-deps
```

### 3. 개발 서버 실행
로컬 환경에서 개발 서버를 띄울 때 사용합니다. 구동 시 브라우저에서 `http://localhost:5173` 으로 접속할 수 있습니다.

```bash
npm run dev
```

### 4. 프로덕션 빌드
운영 환경 배포를 위한 최적화된 결과물(dist)을 생성합니다. 내부적으로 TypeScript 컴파일 검증(`tsc`)을 포함합니다.

```bash
npm run build
```