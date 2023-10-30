var express = require('express');
var router = express.Router();
const passport = require('passport');
const userModel = require('./users.js');
const postModel = require('./post.js');
const comment = require('./comment.js');
const localStrategy = require('passport-local');
const crypto = require("crypto");
const path = require("path");
const multer = require('multer');
const Razorpay = require('razorpay');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oidc');
const {v4 : uuidv4} = require('uuid'); 
const sendMail = require('./nodemailer.js');
const cmtModel = require('./comment.js');
const { set } = require('mongoose');


//GOOGLE OAUTH
router.get('/federated/google', passport.authenticate('google')); //When a user accesses this route, it triggers the passport.authenticate('google') middleware, which redirects the user to Google's OAuth2 authentication page.

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'email', 'profile' ]
}, 
async function verify(issuer, profile, cb) {
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

router.get('/addfriends', isLoggedIn , async function(req, res, next) {
  var data = await userModel.find({});
  var loguser = await userModel.findOne({username:req.session.passport.user});
  res.render('addfriends',{data, loguser});
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


//PASSPORTJS
passport.use(new localStrategy(userModel.authenticate()));  // This strategy is suitable for handling username and password-based authentication.

router.post('/register', function (req, res) {
  var newUser = new userModel({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email
  })
  userModel.register(newUser, req.body.password)   // This method is provided by passport-local-mongoose and handles the hashing of the user's password.
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {  // passport.authenticate() middleware is used here to authenticate the request and local is the strategy used to authenticate the request.This is used to establish a session for the newly registered user
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
    amount: 81739,  
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

router.get('/login/federated/google', passport.authenticate('google'));

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
  .then(function(dets){
    postModel.create({
      caption:req.body.caption,
      location:req.body.location,
      imageurl:req.body.imageurl,
      user:req.session.passport.user,
      author:dets
    }).then(function(lala){
      dets.post.push(lala);
      dets.save()
      .then(function(data){
        res.redirect('profile'); 
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
    res.render('profile',{data,pagename:"Profile Page",loggedin:true});
  })
});

router.get('/account/:username', isLoggedIn, async function(req, res) {
  userModel.findOne({username:req.params.username})
  .populate('post')
  .then(function(data){
    console.log(data);
    res.render('otheraccount',{data});
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

// UPDATE USER DETAILS
router.post('/update', isLoggedIn, function(req, res) {
  userModel.findOne({username:req.session.passport.user})
  .then(function(data){
    if(req.body.name){
      data.name = req.body.name;
    }
    if(req.body.email){
      data.email = req.body.email;
    }
    data.save()
    .then(function(){
      res.redirect('/myaccount');
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

router.post('/upload', upload.single('image'),isLoggedIn, async function(req, res) {
  var loguser = await userModel.findOne({username:req.session.passport.user});
  loguser.profilepic = req.file.filename;
  loguser.save();
  res.redirect('/myaccount');
});

// FRIENDS
router.get('/follow/:id',isLoggedIn ,async function(req, res) {
  var loguser = await userModel.findOne({username:req.session.passport.user});
  var otheruser = await userModel.findOne({_id:req.params.id});

  if(loguser.followings.indexOf(otheruser._id) === -1){
    loguser.followings.push(otheruser._id);
    otheruser.followers.push(loguser._id);
  }
  else{
    var index = loguser.followings.indexOf(otheruser._id);
    loguser.followings.splice(index, 1);
    var index2 = otheruser.followers.indexOf(loguser._id);
    otheruser.followers.splice(index2, 1);
  }
  loguser.save();
  otheruser.save();
  console.log(loguser);
  res.redirect('/addfriends');
});



//DELETE THE ACCOUNT
router.get("/delete", isLoggedIn, function (req, res, next) {
  userModel.findOneAndDelete({username: req.session.passport.user})
  .then(() => {
    res.render('signup')
  }).catch(err => {
    res.send(err)
  })
});




//FORGOT PASSWORD
router.post('/forgot',async function(req, res) {
  var sec = uuidv4();
  var founduser = await userModel.findOne({email: req.body.email});
    if(founduser !== null){
    founduser.secret = sec;
    founduser.expiry = Date.now()+15*1000;
    }
    founduser.save();
    var routeaddress = `http://localhost:3000/forgot/${founduser._id}/${sec}`;
    sendMail(req.body.email, routeaddress);
});

router.get('/forgot/:id/:secret',function(req,res){
  userModel.findOne({_id:req.params.id})
  .then(function(founduser){
    if(founduser.secret === req.params.secret){
      res.render("newpassword", founduser);
    }else{
      res.send("link expired");
    }
  })
})

// router.post('/newpassword/:email',function(req,res){
  // userModel.findOne({email:req.params.email})
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
  // .then(function(){
    // console.log(email)
  // })
// })




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


module.exports = router;