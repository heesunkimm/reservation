# Node.js와 MongoDB를 이용한 예약 시스템

## 프로젝트 목적
 - 목표: Node.js와 MongoDB를 이용하여 만든 예약 시스템을 통해 사용자가 실시간으로 좌석을 예약하고 결제할 수 있도록 구현했습니다.
 - 주요 기능: 로그인, 회원가입, 좌석예약, 결제처리, 예약내역 조회, 실시간 업데이트
 
 - 개발 기간: 24.11.11 ~ 24.11.15
 - 개발 인원: 개인프로젝트
 - Blog: 

## 프로젝트 결과
 - Node.js에서 가장 많이 사용되는 Express 라이브러리를 사용하여 서버 구성
 - Passport 라이브러리를 이용하여 로그인을 구현하고 회원을 관리
 - bcrypt를 이용해 유저의 비밀번호를 암호화하여 DB에 저장
 - 로그인, 회원가입 외의 페이지들은  isAuthenticated 메소드를 호출하여 로그인된 유저만 페이지 접속이 가능하게 처리
 - mongo-connect를 이용해 세션 데이터를 1시간동안 저장하여, 소스 수정시마다 세션이 새로고침되지 않게 처리
 - 아임포트 API를 사용하여 결제 기능을 구현
 - 여러명의 유저가 같은 좌석 결제 요청을 했을 때 MongoDB 트랜잭션을 사용하여, 하나의 세션이 특정 좌석에 대한 예약 상태를 확인하고 처리하는 동안 다른 세션은 그 작업이 완료될 때까지 대기 상태에 들어가게 처리하여 동시성 문제 해결
 - 해당 트랜잭션이 커밋될 경우: 그 결과가 DB에 저장되고 다음 요청은 업데이트된 좌석 상태를 반영해 작업을 처리
 - 해당 트랜잭션이 롤백될 경우: DB에 저장되지 않으며, 대기중이던 다음 요청이 갱신된 데이터를 읽고 트랜잭션을 재시작
 - socket.io를 이용해 실시간으로 좌석의 예약상태를 확인할 수 있게 처리

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
 <div>
    <img src="https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white">
    <img src="https://img.shields.io/badge/github-181717?style=for-the-badge&logo=github&logoColor=white">
    <img src="https://img.shields.io/badge/git-F05032?style=for-the-badge&logo=git&logoColor=white">
 </div>

 - Config
 <div>
    <img src="https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white">
    <img src="https://img.shields.io/badge/NODEMON-%23323330.svg?style=for-the-badge&logo=nodemon&logoColor=%BBDEAD">
 </div>

 - Development
 <div>
    <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white">
    <img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white">
    <img src="https://img.shields.io/badge/mongoDB-47A248?style=for-the-badge&logo=MongoDB&logoColor=white">
    <img src="https://img.shields.io/badge/ejs-%23B4CA65.svg?style=for-the-badge&logo=ejs&logoColor=black">
    <img src="https://img.shields.io/badge/jquery-0769AD?style=for-the-badge&logo=jquery&logoColor=white">
    <img src="https://img.shields.io/badge/socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white">
 </div>