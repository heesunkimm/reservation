// express 라이브러리 변수선언
const express = require('express');
// passport 회원가입 라이브러리 변수선언
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
// connect-mongo 추가
const MongoStore = require('connect-mongo');
const app = express();
// socket.io 추가
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app); // 기존 express 앱을 http 서버로 감싸서 사용
const io = socketIo(server); // socket.io 서버 설정
// Redis 변수 선언
const Redis = require('ioredis');
// Redis 클라이언트 생성
const redis = new Redis({
    host: process.env.HOST,
    port: process.env.PORT
});
// 몽고 DB 라이브러리 변수선언
const { MongoClient } = require('mongodb');
// 환경변수 파일 사용하기위해 선언
require('dotenv').config();
// bcrypt 라이브러리 추가
const bcrypt = require('bcrypt');
// 아임포트 api 변수 선언
const Iamport = require('iamport');
const iamport = new Iamport({
  impKey: process.env.IMPKEY,
  impSecret: process.env.IMPSECRET
});

// CSS 연결
app.use(express.static(__dirname + '/public'));
// view engine 사용설정
app.set('view engine', 'ejs');
// json 데이터 파싱
app.use(express.json());
// url 인코딩된 데이터 파싱 (폼 데이터 처리)
app.use(express.urlencoded({ extended: true }));
// 세션설정
app.use(session({
    secret: process.env.SECRET_KEY,
    resave : false,
    saveUninitialized : false,
    store: MongoStore.create({mongoUrl: process.env.DB_URL}),
    cookie: { 
        secure: false,
        maxAge: 1000 * 60 * 60 * 24, // 세션 쿠키의 유효시간 24시간
    }
}));
// 로그인 여부 확인
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/');
    }
}
// passport 라이브러리 설정
app.use(passport.initialize());
// 세션 저장
app.use(passport.session());
// 몽고DB 연결
let db
const url = process.env.DB_URL
const { ObjectId } = require('mongodb');

redis.on('connect', () => {
  console.log('Redis 연결 성공');
});

redis.on('error', (err) => {
  console.error('Redis 연결 오류:', err.message);
});


let SeatStatus = {}; // 좌석상태를 임시로 담아둘 변수
// socket.io 연결
io.on('connection', (socket) => {
    console.log('클라이언트 연결');
    
    // 클라이언트 연결시 좌석 상태 전송
    socket.emit('seatsStatus', SeatStatus);
    // 좌석예약 상태 업데이트
    socket.on('seatStatusUpdate', (data) => {
        // 클라이언트로부터 받은 좌석 상태 업데이트
        SeatStatus[data.selectedSeat] = data.selectedStatus;

        // 변경된 좌석 상태를 모든 클라이언트에게 전달
        io.emit('seatStatusUpdate', {
            selectedSeat: data.selectedSeat,
            selectedStatus: data.selectedStatus
        });
    });

    socket.on('disconnect', () => {
        console.log('클라이언트 연결종료');
    });
});

new MongoClient(url).connect().then((client)=>{
    console.log('DB연결성공')
    db = client.db('project')
    // 서버연결
    server.listen(process.env.PORT, () => {
    console.log('서버접속중');
    });
}).catch((err)=>{
  console.log(err)
})

// passport 라이브러리 사용자인증 구현코드
passport.use(new LocalStrategy(
    {
        usernameField: 'userId',
        passwordField: 'userPw'
    },
    async (userId, userPw, cb) => {
    try{
        let user = await db.collection('users').findOne({ userId : userId})

        let comparePw = await bcrypt.compare(userPw, user.userPw);

        if (!user) {
          return cb(null, false, { message: '가입된 유저가 아닙니다.' })
        }
        if (!comparePw) {
            return cb(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
        // 인증 성공
        return cb(null, user);
    }catch(e) {
        console.log(e);
    }
}))
// 세션에 로그인한 유저의 _id를 저장
passport.serializeUser(function(user, done) {
    done(null, user._id.toString()); // ObjectId를 문자열로 변환
});
// 페이지가 이동되어도 저장한 세션 정보 유지
passport.deserializeUser(async function(id, done) {
    try {
        let user = await db.collection('users').findOne({_id: new ObjectId(id)}); // 문자열 id를 ObjectId로 변환하여 조회
        // user가 없을 경우
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// login
app.get('/', (req, res) => {
  res.render('login.ejs')
});
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ err: err }); // 에러시 출력
        }else if (!user) {
            return res.status(401).json({ info: info.message }); // 로그인 실패시 메시지 반환
        }
        req.login(user, (err) => {
            if(err) {
              return next(err); // 로그인 도중 에러
            }
            res.redirect('/index');
          });
    })(req, res, next); // 제출한 id/pw를 db와 비교
});

// join
app.get('/join', (req, res) => {
    res.render('join.ejs')
});
app.post('/join', async (req, res) => {
    try{
        let KoRegex = /^[가-힣]+$/;
        let EngNumRegex =  /^[A-Za-z0-9]+$/;

        if(!KoRegex.test(req.body.userName) || req.body.userName.length < 2) {
            return res.send("<script>alert('유저이름은 2글자 이상의 한글만 입력 가능합니다.'); history.back();</script>");
        }else if(!EngNumRegex.test(req.body.userId || req.body.userId.length < 4)){
            return res.send("<script>alert('아이디는 4글자 이상의 영어와 숫자만 입력 가능합니다.'); history.back();</script>");
        }else if(req.body.userPw != req.body.userPw02) {
            return res.send("<script>alert('비밀번호가 서로 일치하지 않습니다.'); history.back();</script>");
        }else if(req.body.userPw == req.body.userPw02 && 
            (!EngNumRegex.test(req.body.userPw) || !EngNumRegex.test(req.body.userPw02)) 
            || req.body.userPw.length < 4 || req.body.userPw02.length < 4) {
            return res.send("<script>alert('비밀번호는 4글자 이상의 영어와 숫자만 입력 가능합니다.'); history.back();</script>");
        }else {
                // 비밀번호 암호화
                let userPw = bcrypt.hashSync(req.body.userPw, 10);
                let idCheck = await db.collection('users').findOne({userId : req.body.userId});
                
                if(idCheck) {
                    return res.send("<script>alert('이미 등록된 아이디입니다.'); history.back();</script>");
                }else {
                    await db.collection('users').insertOne({
                        userName: req.body.userName, 
                        userId: req.body.userId, 
                        userPw: userPw
                    })
                    res.send("<script>alert('회원가입이 완료되었습니다.'); window.location = '/';</script>");
                }
        }
    } catch(e){
        console.log(e);
        res.status(500).json({available: false, message: '서버 오류가 발생했습니다.'});
    }
})

// index
app.get('/index', async (req, res) => {
    // 로그인유저 정보
    let user = {
        userId: req.user.userId,
        userName: req.user.userName
    }
    // 결제내역조회
    let allData = await db.collection('paymentdetails').find({}).toArray();
    res.render('index.ejs', {user, allData})
});
// 예약전 좌석상태 확인
app.get('/reservations', async (req, res) => {
    try {
        // DB에서 해당 시간과 좌석의 예약 상태를 조회
        const userInfo = await db.collection('paymentdetails').findOne({
            reservationTime: req.query.reservationTime,
            reservationSeat: req.query.reservationSeat
        });

        if (!userInfo) {
            // 예약가능
            res.json({available: true, message: '예약 가능'});
        } else {
            // 예약불가
            res.json({available: false, message: '이미 예약된 좌석입니다.'});
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({available: false, message: '서버 오류가 발생했습니다.'});
    }
});
// 결제
app.post('/reservations', async (req,res) => {
    // 기존 db.client를 사용해 세션 시작
    let mongoSession = db.client.startSession();
    try{
        // 트랜잭션 시작
        mongoSession.startTransaction();
        // 결제내역을 조회
        let seatInfo = await db.collection('paymentdetails').findOne({
            reservationTime: req.body.reservationTime, 
            reservationSeat: req.body.reservationSeat
        }, {session: mongoSession});
        // 좌석의 예약 가능 여부 확인
        if (seatInfo) {
            // 이미 예약된 좌석일 경우
            await mongoSession.abortTransaction();
            return res.json({success: false, message: '이미 예약된 좌석입니다.'});
        }

        // 예약가능시 결제내역추가
        await db.collection('paymentdetails').insertOne({
            userId: req.user.userId,
            userName: req.user.userName,
            reservationTime: req.body.reservationTime,
            reservationSeat: req.body.reservationSeat,
            reservationAmount: parseInt(req.body.reservationAmount),
            reservationStatus: '예약완료'
        }, {session: mongoSession})
        // 트랜잭션 커밋
        await mongoSession.commitTransaction();
        // 실시간으로 좌석상태 업데이트
        io.emit('seatStatusUpdate', {
            selectedSeat: req.body.reservationSeat,
            selectedStatus: '예약완료'
        })
        res.json({success: true, message: '결제가 완료되었습니다.'});
        
    } catch(e){
        console.log(e);
        // 에러 발생 시 트랜잭션 롤백
        await mongoSession.abortTransaction();
        res.status(500).json({success: false, message: '서버 오류가 발생했습니다.'});
    } finally{
        mongoSession.endSession();
    }
});

app.get('/reservations/details', async (req, res) => {
    try{
        let result = await db.collection('paymentdetails').find({userId: req.user.userId}).toArray();
        res.render('reservedetails.ejs', {result: result})
    }catch(e) {
        console.log(e);
        res.status(500).json({success: false, message: '서버 오류가 발생했습니다.'});
    }
})

// logout
app.get('/logout', (req, res) => {
    try{
        req.logout(err => {
            if(err) {
                console.log(err);
                return res.status(500).json({message: "로그아웃 실패"});
            }else {
                res.redirect('/');
                console.log("로그아웃 성공")
            }
        });
    } catch(e){
        console.log(e);
        res.status(500).json({success: false, message: '서버 오류가 발생했습니다.'});
    }
})