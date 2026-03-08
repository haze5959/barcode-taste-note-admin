# Barcode Taste Note Admin - Project Rules & Guidelines

## 📌 Project Overview
이 프로젝트는 **"바코드 테이스트 노트 (Barcode Taste Note)"** 서비스 운영을 위한 어드민(Admin) 웹페이지입니다. 
AI 어시스턴트는 작업을 시작하기 전 항상 이 문서를 숙지하고 아래 명시된 기술 스택과 규칙, 요구사항을 준수하여 코드를 작성해야 합니다.

## 🛠 Tech Stack
- **Frontend Framework:** TypeScript + React
- **Admin Library:** Refine (어드민 프레임워크 기반)
- **UI Component Library:** Ant Design (어드민에 필요한 모든 UI 컴포넌트는 Ant Design을 일관되게 사용)
- **Authentication:** Auth0

## 🔐 Authentication Rules (Auth0)
- **Login Provider:** 오직 **Google 로그인**만 연동하여 사용합니다.
- **Access Control:** 브라우저에 인증 토큰 쿠키(Token Cookie)가 존재하지 않는 상태에서 페이지 진입을 요청할 경우, 즉시 **로그인 페이지로 리다이렉트(Redirect)** 처리해야 합니다.

## 🚀 Core Features (제공 기능)
어드민 페이지는 다음과 같은 주요 기능들을 제공해야 합니다:
1. **대시보드 (Dashboard)**: 서비스의 주요 통계 및 현황 요약
2. **신규 추가 제품 보기**: 사용자들이 새롭게 추가한 제품 목록 조회
3. **신규 노트 보기**: 새롭게 작성된 테이스팅 노트 목록 조회
4. **제품 정보 수정하기**: 등록된 제품의 상세 정보 편집 및 업데이트
5. **신고 리스트 보기 및 답변하기**: 사용자 신고 내역 조회 및 처리(답변 작성)
6. **제품 병합 (Merge) 기능**: product에 연결된 노트, 이미지, 바코드를 하나의 product로 합치고 기존 product는 삭제
7. **제품 메인 이미지 변경**: 제품의 메인 이미지 수정 기능

## ⚠️ AI Assistant Guidelines (AI 작업 규칙)
1. **TypeScript 우선:** 모든 코드는 TypeScript로 작성하며, `any` 타입 사용을 지양하고 명확한 인터페이스와 타입을 정의하세요.
2. **UI 일관성:** 커스텀 스타일링은 최소화하고, 가급적 **Ant Design**의 컴포넌트와 **Refine**에서 제공하는 기본 레이아웃을 적극 활용하여 일관된 어드민 UI를 유지하세요.
3. **Refine 생태계 활용:** 라우팅, 데이터 페칭, 폼(Form) 처리, 테이블 상태 관리 등은 Refine 프레임워크의 코어 훅(`useTable`, `useForm` 등)을 우선적으로 사용하여 구현하세요.
4. **모듈화:** 재사용 가능한 로직과 UI는 적절한 컴포넌트 및 훅으로 분리하여 유지보수성을 높이세요.
5. **Language**: 코드 내 주석, 커밋 메시지, Implementation Plan은 **한글(Korean)**로 작성합니다.
