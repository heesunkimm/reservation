# Node.js와 MongoDB를 이용한 예약 시스템

## 프로젝트 목적
 - 목표: Node.js와 MongoDB를 이용하여 만든 예약 시스템을 통해 사용자가 실시간으로 좌석을 예약하고 결제할 수 있도록 구현했습니다.
 - 주요 기능: 로그인, 회원가입, 좌석예약, 결제처리, 예약내역 조회, 실시간 업데이트
 
 - 개발 기간: 24.11.11 ~ 24.11.15
 - 개발 인원: 개인프로젝트

## 프로젝트 결과
 - Express를 사용하여 서버 구성
  
 - Passport로 로그인 및 회원 관리 구현

 - bcrypt로 비밀번호 암호화 후 DB 저장
 
 - isAuthenticated를 통해 로그인된 사용자만 특정 페이지 접근 가능
 
 - mongo-connect로 세션 데이터를 1시간 동안 유지하여, 소스 수정시마다 세션이 새로고침되지 않게 처리
 
 - 아임포트 API를 사용하여 결제 기능 구현
 
 - ioredis를 사용해 동시성 문제 해결
   - 여러 유저가 같은 좌석에 결제 요청 시 lock을 설정하여 첫 번째 요청만 처리 (동시성 문제 해결)
 
 - MongoDB 트랜잭션으로 예약 상태와 결제 정보를 한 번에 처리
   - 트랜잭션 커밋 시: 결과가 DB에 저장되고 다음 요청에 업데이트된 상태 반영
   - 트랜잭션 롤백 시: DB에 저장되지 않고 결제 취소
 
 - socket.io를 이용해 실시간 좌석 예약 상태 확인

 ## 파일구조
    reservation/
    ├── node_modules/
    │ ├── public/
    │ ├── views/
    │ ├── server.js
    │ └── .env
    └── README.md

## 기술 스택
 - Environment
   - Framework: Express
   - IDE: Visual Studio Code
   - Version Control: Git, GitHub

 - Config
   - Package Manager: npm
   - Development Tool: nodemon

 - Development
   - Backend: Node.js, Express
   - Database: MongoDB
   - Templating Engine: EJS
   - Frontend: jQuery
   - Real-time: socket.io
   - Session Management: mongo-connect
   - Concurrency Control: ioredis
   - Payment API: import
