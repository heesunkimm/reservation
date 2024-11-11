// express 라이브러리 변수선언
const express = require('express')
// passport 회원가입 라이브러리 변수선언
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const app = express()
// 몽고 DB 라이브러리 변수선언
const { MongoClient } = require('mongodb')
// 환경변수 파일 사용하기위해 선언
require('dotenv').config()
// bcrypt 라이브러리 추가
const bcrypt = require('bcrypt');

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
  cookie: { 
    secure: false,
    maxAge: 60 * 10 * 10
}
}))
// passport 라이브러리 설정
app.use(passport.initialize());
// 세션 저장
app.use(passport.session());
// 몽고DB 연결
let db
const url = process.env.DB_URL
const { ObjectId } = require('mongodb');
new MongoClient(url).connect().then((client)=>{
    console.log('DB연결성공')
    db = client.db('todolist')
    // 서버연결
    app.listen(process.env.PORT, () => {
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
        let user = await db.collection('user').findOne({ userId : userId})

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
        let user = await db.collection('user').findOne({_id: new ObjectId(id)}); // 문자열 id를 ObjectId로 변환하여 조회
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
                let idCheck = await db.collection('user').findOne({userId : req.body.userId});
                
                if(idCheck) {
                    return res.send("<script>alert('이미 등록된 아이디입니다.'); history.back();</script>");
                }else {
                    await db.collection('user').insertOne({
                        userName: req.body.userName, 
                        userId: req.body.userId, 
                        userPw: userPw
                    })
                    res.send("<script>alert('회원가입이 완료되었습니다.'); window.location = '/';</script>");
                }
        }
    } catch(e){
        console.log(e);
    }
})

// index
app.get('/index', (req, res) => {
    res.render('index.ejs')
});
app.post('/reservation', (req,res) => {
    try{
    } catch(e){
        console.log(e);
    }
});

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
    }
})