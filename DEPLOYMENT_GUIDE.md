# 🙏 해운사 신도관리 시스템 - 배포 가이드

## 📋 목차
1. [Firebase 설정](#1-firebase-설정)
2. [코드 준비](#2-코드-준비)
3. [Vercel 배포](#3-vercel-배포)
4. [최종 확인](#4-최종-확인)

---

## 1. Firebase 설정

### 1-1. Firebase 프로젝트 생성

1. **Firebase 콘솔 접속**
   - https://console.firebase.google.com 방문
   - Google 계정으로 로그인

2. **새 프로젝트 만들기**
   - "프로젝트 추가" 클릭
   - 프로젝트 이름: `해운사-신도관리` (원하는 이름)
   - Google Analytics: 비활성화 (선택사항)
   - "프로젝트 만들기" 클릭

### 1-2. Realtime Database 설정

1. **Database 생성**
   - 좌측 메뉴에서 "Realtime Database" 클릭
   - "데이터베이스 만들기" 클릭
   - 위치: `asia-southeast1` (가까운 지역 선택)
   - 보안 규칙: "테스트 모드에서 시작" 선택
   - "사용 설정" 클릭

2. **보안 규칙 설정**
   - "규칙" 탭 클릭
   - 다음 규칙 입력:

```json
{
  "rules": {
    "believers": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

   - "게시" 클릭

### 1-3. 웹 앱 등록

1. **앱 추가**
   - 프로젝트 설정 (톱니바퀴 아이콘) > "프로젝트 설정"
   - "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
   - 앱 닉네임: `해운사 웹`
   - Firebase 호스팅: 체크 안 함
   - "앱 등록" 클릭

2. **구성 정보 복사**
   - 다음과 같은 형식의 코드가 표시됩니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "temple-xxxxx.firebaseapp.com",
  databaseURL: "https://temple-xxxxx-default-rtdb.firebaseio.com",
  projectId: "temple-xxxxx",
  storageBucket: "temple-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
};
```

   - **이 정보를 복사해두세요!**

---

## 2. 코드 준비

### 2-1. Firebase 설정 추가

1. `components/TempleManagementSystem.jsx` 파일 열기
2. 파일 상단의 `firebaseConfig` 부분을 복사한 정보로 교체:

```javascript
// 이 부분을 찾아서
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // ...
};

// 복사한 실제 정보로 교체
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "temple-xxxxx.firebaseapp.com",
  databaseURL: "https://temple-xxxxx-default-rtdb.firebaseio.com",
  projectId: "temple-xxxxx",
  storageBucket: "temple-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
};
```

### 2-2. GitHub에 코드 업로드

1. **GitHub 계정 생성** (없는 경우)
   - https://github.com 방문
   - "Sign up" 클릭

2. **새 저장소 생성**
   - GitHub 로그인 후 우측 상단 "+" > "New repository"
   - Repository name: `temple-management`
   - Public 선택
   - "Create repository" 클릭

3. **코드 업로드**
   - 로컬 컴퓨터에서 터미널/명령 프롬프트 열기
   - 프로젝트 폴더로 이동
   - 다음 명령어 실행:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/temple-management.git
git branch -M main
git push -u origin main
```

---

## 3. Vercel 배포

### 3-1. Vercel 계정 생성

1. https://vercel.com 방문
2. "Sign Up" 클릭
3. "Continue with GitHub" 선택
4. GitHub 계정 연동 승인

### 3-2. 프로젝트 배포

1. **Import Project**
   - Vercel 대시보드에서 "Add New..." > "Project" 클릭
   - GitHub 저장소 목록에서 `temple-management` 선택
   - "Import" 클릭

2. **프로젝트 설정**
   - Framework Preset: `Next.js` (자동 감지됨)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)

3. **환경 변수 설정** (선택사항)
   - 나중에 필요시 추가 가능
   - 지금은 건너뛰기

4. **배포 시작**
   - "Deploy" 클릭
   - 배포 진행 상황 확인 (약 2-3분 소요)

### 3-3. 배포 완료

- 배포가 완료되면 다음과 같은 URL이 생성됩니다:
  - `https://temple-management-xxxxx.vercel.app`
- 이 URL을 저장하고 관계자들과 공유하세요!

---

## 4. 최종 확인

### 4-1. 기능 테스트

1. **로그인 테스트**
   - 관리자: 비밀번호 `0804`
   - 일반 사용자: 비밀번호 `1211`

2. **신도 추가 테스트**
   - 관리자 계정으로 로그인
   - "신도 추가" 버튼 클릭
   - 테스트 데이터 입력
   - 저장 확인

3. **실시간 동기화 테스트**
   - 두 개의 브라우저 창 열기
   - 한 창에서 데이터 추가/수정
   - 다른 창에서 자동 업데이트 확인

### 4-2. Firebase 데이터 확인

1. Firebase 콘솔 접속
2. Realtime Database 메뉴 선택
3. `believers` 노드에서 저장된 데이터 확인

---

## 📱 모바일 접근

- 생성된 URL은 모바일에서도 접근 가능합니다
- 모바일 브라우저 주소창에 URL 입력
- 홈 화면에 추가 가능 (앱처럼 사용)

---

## 🔒 보안 강화 (선택사항)

### 비밀번호 변경

`components/TempleManagementSystem.jsx` 파일에서:

```javascript
const handleLogin = () => {
  if (loginPassword === '새로운관리자비밀번호') {
    setUserRole('admin');
  } else if (loginPassword === '새로운사용자비밀번호') {
    setUserRole('user');
  }
};
```

### Firebase 인증 추가

- Firebase Authentication 사용
- 이메일/비밀번호 로그인 구현
- 더 강력한 보안 제공

---

## 🆘 문제 해결

### 배포 오류

1. **빌드 실패**
   - `package.json` 파일 확인
   - 의존성 버전 확인

2. **Firebase 연결 오류**
   - Firebase 설정 정보 재확인
   - Database 규칙 확인

3. **데이터가 저장되지 않음**
   - Firebase Console에서 Database 활성화 확인
   - 보안 규칙 확인

### 도움이 필요하면

- Firebase 문서: https://firebase.google.com/docs
- Vercel 문서: https://vercel.com/docs
- Next.js 문서: https://nextjs.org/docs

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] Firebase 프로젝트 생성 완료
- [ ] Realtime Database 활성화
- [ ] Firebase 설정 정보 코드에 추가
- [ ] GitHub 저장소 생성 및 코드 업로드
- [ ] Vercel 계정 생성
- [ ] Vercel에서 프로젝트 배포
- [ ] 배포된 URL 접속 확인
- [ ] 로그인 기능 테스트
- [ ] 데이터 추가/수정 테스트
- [ ] 실시간 동기화 확인

---

## 🎉 완료!

축하합니다! 해운사 신도관리 시스템이 성공적으로 배포되었습니다.

**배포된 URL**: `https://your-app.vercel.app`

이제 이 URL을 관계자들과 공유하여 함께 사용하세요!
