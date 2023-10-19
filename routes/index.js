var express = require('express');
var router = express.Router();
const passport = require('passport');
const userModel = require('./users');
const postModel = require('./post');
const comment = require('./comment');
const localStrategy = require('passport-local');
const crypto = require("crypto");
const path = require("path");
const multer = require('multer');
const Razorpay = require('razorpay');
require('dotenv').config();
var GoogleStrategy = require('passport-google-oidc');
const {v4 : uuidv4} = require('uuid'); 
const sendMail = require('./nodemailer');
const cmtModel = require('./comment');



//GOOGLE OAUTH
router.get('/federated/google', passport.authenticate('google'));

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'email', 'profile' ]
}, async function verify(issuer, profile, cb) {
  let User = await user.findOne({email: profile.emails[0].value})
  if(User){
    return cb(null, User);
  }else{
    let newUser = await user.create({name:profile.displayName, email:profile.emails[0].value})
    newUser.save();
    return cb(null, newUser);
  }
}));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/profile',
  failureRedirect: '/'
}));




//ALL ROUTES
router.get('/' ,function(req, res) {
  res.render('index');
});

router.post('/', function(req, res, next) {
  res.render('index');
});

router.get('/signup', function(req, res) {
  res.render('signup');
});

router.post('/signup', function(req, res) {
  res.render('signup');
});

router.get('/usernotfound', function(req, res) {
  res.render('usernotfound');
});

router.get('/chats', function(req, res, next) {
  res.render('chats');
});

router.get('/addfriends', isLoggedIn , function(req, res, next) {
  res.render('addfriends');
});

router.get('/buypremium', isLoggedIn , function(req, res, next) {
  res.render('premium');
});

router.get('/createpost', isLoggedIn , function(req, res, next) {
  res.render('createpost');
});

router.get('/forgot', function(req, res, next) {
  res.render('forgot');
});

router.get('/myaccount', function(req, res) {
  res.render('myaccount');
});





//PASSPORTJS
passport.use(new localStrategy(userModel.authenticate()));

router.post('/register', function (req, res) {
  var newUser = new userModel({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email
  })
  userModel.register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile');
      })
    })
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: 'usernotfound'
}), function (req, res, next) { });

router.get('/logout', function (req, res, next) {
  req.logOut(function(err){
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/');
  }
}




//RAZORPAY
var instance = new Razorpay({
  key_id: 'rzp_test_r6EJwrxJbscSV9',
  key_secret: 'A0ETOcXCfUXgupemi1uCptXr',
});

router.post('/create/orderID',(req, res, next)=> {
  var options = {
    amount: 81739,  // amount in the smallest currency unit
    currency:"INR",
    receipt: "order_rcptid_11"
  };
  instance.orders.create(options, function(err, order) {
    return res.send(order);
  });
});

router.post("/api/payment/verify",(req,res)=>{

 let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;

  var crypto = require("crypto");
  var expectedSignature = crypto.createHmac('sha256', 'A0ETOcXCfUXgupemi1uCptXr')
                                  .update(body.toString())
                                  .digest('hex');
                                  
  if(expectedSignature === req.body.response.razorpay_signature)
   response={"signatureIsValid":"true"}
      res.send(response);
});

router.get('/success',isLoggedIn, (req, res)=> {
  res.render('success.ejs');
});

router.get('/federated/google', passport.authenticate('google'));

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'email', 'profile' ]
}, async function verify(issuer, profile, cb) {
  let User = await userModel.findOne({email: profile.emails[0].value})
  if(User){
    return cb(null, User);
  }else{
    let newUser = await userModel.create({name:profile.displayName, email:profile.emails[0].value})
    newUser.save();
    return cb(null, newUser);
  }
}));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/profile',
  failureRedirect: '/'
}));




//POSTS
router.post('/createpost', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data){
    postModel.create({
      caption:req.body.caption,
      location:req.body.location,
      imageurl:req.body.imageurl,
      user:req.session.passport.user,
      author:data
    }).then(function(lala){
      data.post.push(lala);
      data.save()
      .then(function(){
        res.render('createpost'); 
      })
    })
  })
}); 
 
router.get('/createpost', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .populate('post')
  .then(function(data){
    res.render('createpost',{data,pagename:"Posts",loggedin:true});
  })
}); 

router.get('/profile', isLoggedIn, async function(req, res) {
  postModel.find({})
  .populate('author')
  .populate('comment')
  .then(function(data){
    console.log(data);
    res.render('profile',{data,pagename:"Profile Page",loggedin:true});
  })
});




//LIKES OF THE POST
router.get('/likes/:id', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data2){
    postModel.findOne({_id:req.params.id})
  .then(function(post){
    if(post.likes.indexOf(data2._id) === -1){
      post.likes.push(data2._id);
    }else{
      var index = post.likes.indexOf(data2._id);
      post.likes.splice(index, 1);
    }
    post.save().then(function(){
      res.redirect(req.header('referer'));
    })
  })
  })
});



//PROFILE IMAGE UPLOAD FROM MY ACCOUNT PAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname);
  }
})

const upload = multer({ storage: storage })

router.get('/myaccount',isLoggedIn ,function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data){
    res.render('myaccount',{data})
  })
});

router.post('/upload', upload.single('image'),isLoggedIn,function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data){
      data.image.push(`../uploads/${req.file.filename}`)
      data.profilepic = data.image[data.image.length-1]
      data.save()
      .then(function(data){
       res.redirect('/myaccount',{data});
    })
  })
});




//DELETE THE ACCOUNT
router.post("/delete", isLoggedIn, function (req, res, next) {
  userModel.findOneAndDelete({username: req.session.passport.user})
  .then(() => {
    res.render('signup')
  }).catch(err => {
    res.send(err)
  })
});




//FORGOT PASSWORD
router.post('/forgot',function(req, res) {
  var sec = uuidv4();
  userModel.findOne({email:req.body.email})
  .then(function(founduser){
    if(founduser !== null){
    founduser.secret = sec;
    founduser.expiry = Date.now()+15*1000;
    founduser.save()
    .then(function(){
      var routeaddress = `http://localhost:3000/forgot/${founduser._id}/${sec}`;
      sendMail(req.body.email,routeaddress)
      .then(function(){
        res.send("Check your email");
      })
    })
  }
  })
});

router.get('/forgot/:id/:secret',function(req,res){
  userModel.findOne({_id:req.params.id})
  .then(function(founduser){
    if(founduser.secret === req.params.secret){
      res.render('newpassword',{founduser,pagename:"New Password",loggedin:false});
    }else{
      res.send("link expired");
    }
  })
})

router.post('/newpassword/:email',function(req,res){
  userModel.findOne({email:req.params.email})
  // .then(function(founduser){
  //   founduser.setPassword(req.body.password1,function(){
  //     founduser.save()
  //   .then(function(){
  //     req.logIn(founduser,function(){
  //       res.redirect('/profile');
  //     })
  //   })
  //   })
  // })
  .then(function(){
    console.log(email)
  })
})




//COMMENTS SECTION
router.post('/comment/:id', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(userdata){
    postModel.findOne({_id:req.params.id})
  .then(function(postfound){
    cmtModel.create({
      comment: req.body.comment,
      cmtuser: req.session.passport.user
    }).then(function(data){
        postfound.comment.push(data)
        userdata.post.push(postfound)
        postfound.save()
        .then(function(foundcmt){
          res.redirect('/profile');
        })
    })
  })
  })
});

router.get('/showcmt', function(req, res) {
cmtModel.find()
.populate('author')
.then(function(data){
  res.send(data);
})
});


//UPDATE EXISTING DETAILS



module.exports = router;