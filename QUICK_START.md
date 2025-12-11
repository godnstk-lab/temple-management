# 🚀 빠른 시작 가이드

## 📋 3단계로 배포하기

### 1단계: Firebase 설정 (5분)

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" → 프로젝트 이름 입력
3. "Realtime Database" → "데이터베이스 만들기"
4. 웹 앱 등록 → Firebase 설정 코드 복사

### 2단계: 코드 수정 (2분)

1. `components/TempleManagementSystem.jsx` 파일 열기
2. Firebase 설정 정보 붙여넣기:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "여기에-복사한-정보",
  authDomain: "여기에-복사한-정보",
  databaseURL: "여기에-복사한-정보",
  // ... 나머지 정보
};
\`\`\`

### 3단계: Vercel 배포 (5분)

1. https://vercel.com 접속
2. GitHub 연동
3. 저장소 선택 → "Deploy" 클릭
4. 완료! URL 공유하기

---

## ✅ 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] Realtime Database 활성화
- [ ] Firebase 설정 정보 코드에 추가
- [ ] GitHub에 코드 업로드
- [ ] Vercel 배포
- [ ] 배포 URL 확인

---

## 🆘 도움이 필요하면?

자세한 가이드: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🎯 배포 후 할 일

1. **로그인 테스트**
   - 관리자: `0804`
   - 사용자: `1211`

2. **테스트 데이터 입력**
   - 신도 1명 추가
   - 불사 내역 입력
   - 입금 내역 입력

3. **URL 공유**
   - 관계자들에게 배포 URL 전달
   - 비밀번호 공유

---

**예상 소요 시간**: 총 15분 🎉
