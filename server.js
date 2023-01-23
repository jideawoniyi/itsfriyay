/**
 * app.js
 *
 * A Node.js, Express, Passport, and Mongoose application for a login and logout site.
 *
 * @author:  Jay AWoniyi
 * @copyright: @Jay yycm 2022
 * @license:  MIT
 *
 * @summary: A Node.js, Express, Passport, and Mongoose application for a login and logout site.
 *
 * @requires express
 * @requires mongoose
 * @requires passport
 * @requires passport-local
 * @requires connect-flash
 * @requires express-session
 * @requires ejs
 *
 * @function
 * @param {Object} app - The Express application object.
 * @param {Object} mongoose - The Mongoose object for connecting to and interacting with the MongoDB database.
 * @param {Object} passport - The Passport object for handling authentication.
 * @param {Object} flash - The connect-flash object for displaying flash messages in the Express app.
 * @param {Object} session - The express-session object for managing sessions in the Express app.
 * @param {Object} ejs - The EJS object for rendering templates.
 *
 * @returns {Object} - The configured Express app object.
 *
 * @description:
 * This file configures the Node.js, Express, Passport, and Mongoose application for a login and logout site.
 * It sets up the database connection, middlewares, view engine, routes, and error handling for the app.
 */
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
// const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY')
const uuid = require('uuid');
const ejs = require('ejs');
const moment = require('moment');
const http = require('http');
const socket = require('socket.io');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const dotenv = require('dotenv');
dotenv.config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Require the User model
const User = require('./models/user');

mongoose.set('strictQuery', true);
// Set up the database connection
mongoose.connect('mongodb://localhost/login-logout-site', { useNewUrlParser: true, useUnifiedTopology: true });

// Set up the Passport config
require('./config/passport')(passport);

// Set up the middlewares
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

// Set the view engine to EJS
app.set('view engine', 'ejs');


//Login route

app.get('/login', (req, res) => {
    // check if user is logged in
    if (!req.session.user) {
      res.render('login', { message: req.flash('error'), messageType: 'error', user: req.user });
    } else {
        res.redirect('/dashboard');
    }
});

// Add a check to ensure that the user's email is verified before allowing them to log in
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
  if (err) {
  return res.render('register', { message: err.message, messageType: 'error', user: req.user });
  }
  if (!user) {
  req.flash('error', 'Invalid email or password');
  return res.redirect('/login');
  }
  if (!user.emailVerified) {
  req.flash('error', 'Please verify your email before logging in');
  return res.redirect('/verify-email');
  }
  req.logIn(user, (err) => {
  if (err) {
  return next(err);
  }
  saveLoginEvent(user.email,user.username); // save login event to database
  // Update status to "online" and last seen to the current time
  User.findByIdAndUpdate(req.user, { status: 'online', lastSeen: Date.now() }, (err, user) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Successfully updated user after login');
  }
  });
  return res.redirect('/dashboard');
  });
  })(req, res, next);
  }); 


  app.get('/home', (req, res) => {
    res.render('home');
  });
  

  app.get('/register', (req, res) => {
    res.render('register', { message: req.flash('error'), user: req.user });
  });
  
    // POST route for registration
    app.post('/register', (req, res) => {
      const { username, phonenumber, email, password } = req.body;
    
      User.findOne({ $or: [{username: username}, {email: email}] }, (error, user) => {
        if (error) {
          console.error(error);
          res.sendStatus(500);
        } else if (user) {
          res.render('register', {
            message: 'Username or Email already exists.',
            user: req.user
          });
        } else {
          User.register(new User({ username, phonenumber, email, wallet: {}, emailVerified: false }), password, (err) => {
            if (err) {
              return res.render('register', { message: err.message, messageType: 'error', user: req.user });
            }
    
            // Send verification email
            sendVerificationEmail(email, username);
    
            // Authenticate the user after registration
            passport.authenticate('local', (err, user) => {
              if (err) {
                  req.flash('error', err.message)
                  return res.redirect('/register');
}
req.logIn(user, (err) => {
if (err) {
req.flash('error', err.message);
return res.redirect('/register');
}
saveRegistrationEvent(email,username);
res.redirect('/verify-email');
});
})(req, res);
});
}
});

});


  // POST route for login
  app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
    if (err) {
    return res.render('register', { message: err.message, messageType: 'error', user: req.user });
    }
    if (!user) {
    req.flash('error', 'Invalid email or password');
    return res.redirect('/login');
    }
    req.logIn(user, (err) => {
    if (err) {
    return next(err);
    }
    saveLoginEvent(user.email,user.username); // save login event to database
    // Update status to "online" and last seen to the current time
    User.findByIdAndUpdate(req.user, { status: 'online', lastSeen: Date.now() }, (err, user) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Successfully updated user after login');
    }
    });
    return res.redirect('/dashboard');
    });
    })(req, res, next);
    });
    
  
    app.get('/chat', (req, res) => {
      // check if user is logged in
      if (!req.user) {
          res.redirect('/login');
      } else {
          res.render('chat');
          io.on('connection', (socket) => {
              // code for handling socket connections
          });
      }
  });



// console.log(process.env.GMAIL_USER);
// console.log(process.env.GMAIL_PASSWORD);
// Send the verification email
function sendVerificationEmail(email, username) {
  const verificationLink = `http://localhost:3000/verify-email/${username}`;

  // Use the nodemailer library to send the email
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });


  const mailOptions = {
    from: 'dcarbonizergmail.com',
    to: email,
    subject: 'Please Verify your email',
    html: `  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml"><head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge">
    <!-- Add the Bootstrap CSS file -->
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
    <style type="text/css">
  body, p, div {
    font-family: inherit;
    font-size: 14px;
  }
  body {
    color: #000000;
  }
  body a {
    color: #1188E6;
    text-decoration: none;
  }
  p { margin: 0; padding: 0; }
  table.wrapper {
    width:100% !important;
    table-layout: fixed;
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;
    -moz-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  img.max-width {
    max-width: 100% !important;
  }
  .column.of-2 {
    width: 50%;
  }
  .column.of-3 {
    width: 33.333%;
  }
  .column.of-4 {
    width: 25%;
  }
  @media screen and (max-width:480px) {
    .preheader .rightColumnContent,
    .footer .rightColumnContent {
      text-align: left !important;
    }
    .preheader .rightColumnContent div,
    .preheader .rightColumnContent span,
    .footer .rightColumnContent div,
    .footer .rightColumnContent span {
      text-align: left !important;
    }
    .preheader .rightColumnContent,
    .preheader .leftColumnContent {
      font-size: 80% !important;
      padding: 5px 0;
    }
    table.wrapper-mobile {
      width: 100% !important;
      table-layout: fixed;
    }
    img.max-width {
      height: auto !important;
      max-width: 100% !important;
    }
    a.bulletproof-button {
      display: block !important;
      width: auto !important;
      font-size: 80%;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    .columns {
      width: 100% !important;
    }
    .column {
      display: block !important;
      width: 100% !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
  }
</style>
    <!--user entered Head Start--><link href="https://fonts.googleapis.com/css?family=Muli&display=swap" rel="stylesheet"><style>
body {font-family: 'Muli', sans-serif;}
</style><!--End Head user entered-->
  </head>
  <body>
    <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;">
      <div class="webkit">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
          <tbody><tr>
            <td valign="top" bgcolor="#FFFFFF" width="100%">
              <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                <tbody><tr>
                  <td width="100%">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tbody><tr>
                        <td>
                          <!--[if mso]>
  <center>
  <table><tr><td width="600">
<![endif]-->
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                    <tbody><tr>
                                      <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
  <tbody><tr>
    <td role="module-content">
      <p></p>
    </td>
  </tr>
</tbody></table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:30px 20px 30px 20px;" bgcolor="#f6f6f6">
  <tbody>
    <tr role="module-content">
      <td height="100%" valign="top">
        <table class="column" width="540" style="width:540px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="">
          <tbody>
            <tr>
              <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="72aac1ba-9036-4a77-b9d5-9a60d9b05cba">
  <tbody>
    <tr>
      <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
        <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px;" width="29" alt="" data-proportionally-constrained="true" data-responsive="false" src="http://cdn.mcauto-images-production.sendgrid.net/954c252fedab403f/9200c1c9-b1bd-47ed-993c-ee2950a0f239/29x27.png" height="27">
      </td>
    </tr>
  </tbody>
</table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="331cde94-eb45-45dc-8852-b7dbeb9101d7">
  <tbody>
    <tr>
      <td style="padding:0px 0px 20px 0px;" role="module-content" bgcolor="">
      </td>
    </tr>
  </tbody>
</table><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="d8508015-a2cb-488c-9877-d46adf313282">
  <tbody>
    <tr>
      <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
        <div style="font-family: inherit; text-align: center"><span style="color: #000; font-size: 18px"><strong>Welcome to itsfriyay!&nbsp;</strong></span></div>
      </td>
    </tr>
  </tbody>
</table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="27716fe9-ee64-4a64-94f9-a4f28bc172a0">
  <tbody>
    <tr>
      <td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
      </td>
    </tr>
  </tbody>
</table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="948e3f3f-5214-4721-a90e-625a47b1c957" data-mc-module-version="2019-10-22">
  <tbody>
    <tr>
      <td style="padding:50px 30px 18px 30px; line-height:36px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="font-size: 43px">Thanks for signing up, ${username}!&nbsp;</span></div><div></div></div></td>
    </tr>
  </tbody>
</table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="a10dcb57-ad22-4f4d-b765-1d427dfddb4e" data-mc-module-version="2019-10-22">
  <tbody>
    <tr>
      <td style="padding:18px 30px 18px 30px; line-height:22px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="font-size: 18px">
       
        <p></p>You would be <strong>unable to login</strong> if this process is incomplete.</p>
         
   </span></div>
    <br>
    <br>
<div></div></div></td>
    </tr>
  </tbody>
</table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7770fdab-634a-4f62-a277-1c66b2646d8d">
  <tbody>
    <tr>
      <td style="padding:0px 0px 20px 0px;" role="module-content" bgcolor="#ffffff">
      </td>
    </tr>
  </tbody>
</table><table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed;" width="100%" data-muid="d050540f-4672-4f31-80d9-b395dc08abe1">
    <tbody>
      <tr>
        <td align="center" bgcolor="#ffffff" class="outer-td" style="padding:0px 0px 0px 0px;">
          <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align:center;">
            <tbody>
              <tr>
              <td align="center" bgcolor="#ffbe00" class="inner-td" style="border-radius:6px; font-size:16px; text-align:center; background-color:inherit;">
                <a href="${verificationLink}" style="background-color:#ffbe00; border:1px solid #ffbe00; border-color:#ffbe00; border-radius:0px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;" target="_blank">Verify Email Now</a>
              </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7770fdab-634a-4f62-a277-1c66b2646d8d.1">
  <tbody>
    <tr>
      <td style="padding:0px 0px 50px 0px;" role="module-content" bgcolor="#ffffff">
      </td>
    </tr>
  </tbody>
</table>
            </td>
          </tr>
        </tbody></table>
      </div>
    </center>
  
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2r0a5c+pZ6A4aV5zG4aLnBh/kR0JKI" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js" integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>

</body>
</html>`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
}

    


// Set up the email verification route
app.get('/verify-email', checkAuthenticated, (req, res) => {
  if (req.user.emailVerified) {
    res.render('verify-email', {
      message: 'Your email is already verified.',
    });
  } else {
    res.render('verify-email', { message: 'Verification email sent. Please check your email to verify your account.' });
  }
});

app.post('/send-verification-email', checkAuthenticated, (req, res) => {
  
 
  if(user){
    sendVerificationEmail(email, user.username);
    res.render('verify-email', { message: 'Verification email sent. Please check your email to verify your account.' });
 }
 
});

app.get('/verify-email/:username', async (req, res) => {
  try {
    const user = await User.findOne({username: req.params.username});
    if(user){
        await User.findByIdAndUpdate(user._id, { $set: { emailVerified: true } });
        res.render('verify-email', {
            message: 'Your email has been verified. You can now log in to your account.',username:user.username
        });
    }else{
        res.send("Invalid user");
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});




    

 //Get Users Route
 app.get('/users', isLoggedIn, async (req, res) => {
  try {
    // Check if there are search criteria in the query
    if (req.query.searchBy && req.query.searchOption) {
      // If there are search criteria, use them to search the User model
      const searchBy = req.query.searchBy;
      const searchOption = req.query.searchOption;
      let users;
      if (searchBy === 'status') {
        users = await User.find({status: searchOption});
      } else if (searchBy === 'phonenumber') {
        users = await User.find({phonenumber: searchOption});
      } else if (searchBy === 'email') {
        users = await User.find({email: searchOption});
      } else if (searchBy === 'username') {
        users = await User.find({username: searchOption});
      } else if (searchBy === 'walletId') {
        users = await User.find({"wallet.id": searchOption});
      } else if (searchBy === 'walletStatus') {
        users = await User.find({"wallet.isActive": searchOption === "Active" ? true : false});
      } else {
        // If searchBy is "All Users" or any other value, return all users
        users = await User.find({});
      }
      res.render('users', { message: req.flash('error'), user: req.user, users: users });
    } else {
      // If there are no search criteria, return all users
      const users = await User.find({});
      res.render('users', { message: req.flash('error'), user: req.user, users: users });
    }
  } catch (error) {
    console.error(error);
  }
});



app.get('/search', isLoggedIn,async (req, res) => {
  try {
    const searchBy = req.query.searchBy;
    const statusOption = req.query.statusOption;
    const searchTerm = req.query.searchTerm;
    let users;
    if (searchBy === 'status') {
      users = await User.find({status: statusOption});
    } else if (searchBy === 'phonenumber') {
      users = await User.find({phonenumber: searchTerm});
    } else if (searchBy === 'email') {
      users = await User.find({email: searchTerm});
    } else if (searchBy === 'username') {
      users = await User.find({username: searchTerm});
    } else if (searchBy === 'walletId') {
      users = await User.find({"wallet.id": searchTerm});
    } else if (searchBy === 'walletStatus') {
      users = await User.find({"wallet.isActive": searchTerm === "Active" ? true : false});
    }else if (searchBy === '') {
      req.flash('error', 'You must enter a search criteria');
    } else {
      // If searchBy is "all" or any other value, return all users
      users = await User.find({});
    }
    res.render('users', { message: req.flash('error'), user: req.user, users: users });
  } catch (error) {
    console.error(error);
  }
});
app.get('/fundwallet', isLoggedIn, (req, res) => {
  res.render('fundwallet', { user: req.user, walletId: req.user.wallet.Id, message:'' });
  });
  
  app.post('/fundwallet', isLoggedIn, async (req, res) => {
    try {
      const walletId = req.body.walletId;
      var amount = req.body.amount;
     
      const user = await User.findOne({ 'wallet.id': walletId });
      if (!user) {
        return res.json({ success: false, message: 'Invalid wallet id' });
      }
      amount = Number(amount);
      user.wallet.balance = parseFloat(user.wallet.balance) + amount;
      console.log( `the new balance is: ${user.wallet.balance}`);
      user.wallet.isActive = true;
      await user.save();
      // res.json({ success: true, message: 'Wallet funded successfully' });
      res.send(`
      <head>
      <!-- Bootstrap CSS -->
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
      <!-- Bootstrap JavaScript -->
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js" integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>
    </head>
    <div class="container mt-5">
<div class="alert alert-success alert-dismissible fade show" role="alert" style="text-align: center">
Wallet funded successfully. Your new balance is: ${user.wallet.balance}
<button type="button" class="close" data-dismiss="alert" aria-label="Close">
<span aria-hidden="true">&times;</span>
</button>
</div>
</div>

<script>
setTimeout(function() {
window.location.href = '/dashboard';
}, 5000);
</script>

      `);
    } catch (error) {
      // res.json({ success: false, message: error });
      res.redirect('/fundwallet');
    }
  });
  

  // Dashboard route

  app.get('/dashboard', (req, res) => {
    // Check if the user is logged in
    if (req.isAuthenticated()) {
      // Fetch the user's data from the database
      User.findById(req.user, (err, user) => {
        if (err) {
          console.error(err);
          req.flash('error', err.message);
          return res.redirect('/home');
        }
        // Render the dashboard page and pass the user's data to the template
        res.render('dashboard', { message: req.flash('error'), user: req.user, users: user,page : 1 });
   
      });
    } else {
      // If the user is not logged in, redirect to the login page
      res.redirect('/home');
    }
  });


  app.get('/logout/:userdetails', (req, res) => {
    const userdetails = req.params.userdetails;
    console.log(`The userdetails from the dashboard is ${userdetails}`);
    req.logout((err) => {
      if (err) {
        console.error(err);
        req.flash('error', err.message);
        return res.redirect('/home');
      }
      
      // If the user is logged in, save a logout event and redirect to the login page
      if (req.user) {
        saveLogoutEvent(userdetails);
      }
      res.redirect(`/logoutstatus?userdetails=${userdetails}`);
    });
  });
  

  app.get('/logoutstatus', (req, res) => {
    const userdetails = req.query.userdetails;
    console.log(`The userdetails parsed from /logout/:userdetails route is ${userdetails}`);
    User.findOne({ username: userdetails }, (err, user) => {
      if (err) {
        console.error(err);
        res.send('Error finding user');
      } else {
        user.status = 'offline';
        user.lastSeen = Date.now();
        user.save((error) => {
          if (error) {
            console.error(error);
            res.send('Error updating user status');
          } else {
            saveLogoutEvent(userdetails);
            console.log('Successfully updated user after logout');
            // Query the database to verify the update was successful
            User.findOne({ username: userdetails }, (verifyError, updatedUser) => {
              if (verifyError) {
                console.error(verifyError);
                res.send('Error verifying update');
              } else if (updatedUser.status === 'offline') {
                // Display the alert message
                res.send(`
                <head>
                <!-- Bootstrap CSS -->
                <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
                <!-- Bootstrap JavaScript -->
                <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js" integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>
              </head>
              <div class="container mt-5">
  <div class="alert alert-success alert-dismissible fade show" role="alert" style="text-align: center">
  You have signed out successfully.
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
</div>

<script>
  var countDown = 5000 / 1000;  // convert milliseconds to seconds
  var intervalId = setInterval(function() {
    countDown--;
    document.getElementsByClassName("alert")[0].innerHTML = "You have signed out successfully. Redirecting to homepage in " + countDown + " seconds." + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button>';
    if (countDown === 0) {
      clearInterval(intervalId);
      window.location.href = '/home';
    }
  }, 1000);
</script>


                `);
              } else {
                res.send('Error verifying update');
              }
            });
          }
        });
      }
    });
});

  
  //User edit user profile route

  app.get('/update-profile', isLoggedIn, (req, res) => {
        res.render('edit-profile', { message: req.flash('error'), user: req.user,page : 1 }); 
    }); 
        app.post('/update-profile', isLoggedIn, (req, res) => {
            const { email , username} = req.body;
            // Check if email already exists in the database
            User.findOne({ email }, (err, user) => {
              if (err) {
                console.error(err);
                return res.redirect('/edit-profile');
              }
          
              // If email exists, flash an error message
              if (user) {
                req.flash('error', 'Email already exists');
                saveUpdateEvent("user update attempted but new email already exists", email);
                return res.redirect('/edit-profile');
              }
          
              // If email does not exist, update user's email
              User.findByIdAndUpdate(req.user.email, { email }, (err, user) => {
                if (err) {
                  console.error(err);
                  return res.redirect('/edit-profile');
                }
                saveUpdateEvent(email,username);
                res.redirect('/dashboard');
              });
            });
          });
    
          //Get list of all users if logged in, otherwise, login
          app.post('/users', isLoggedIn, (req, res) => {
            // Check if email already exists in the database
            User.find({ }, (err, user) => {
              if (err) {
                console.error(err);
                return res.redirect('/dashboard');
              }
          
              // If users exist, flash an error message
              if (user) {
                return res.render('users');
              }
              });
            });
           
 
  // Create a schema for audit events
  const auditEventSchema = new mongoose.Schema({
    date: Date,
    description: String,
    email: String,
    username: String,
    type: String
  });
  
  // Create a model for audit events
  const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);
  
  // Save a login event to the database
  function saveLoginEvent(email,username) {
    const event = new AuditEvent({
      date: new Date(),
      description: `User with email ${email} has logged in.`,
      email: email,
      username: username,
      type: 'Login'
    });
    event.save((err) => {
      if (err) {
        console.error(err);
      }
    });
  }
  

  // Save a logout event to the database
  function saveLogoutEvent(email) {
    const event = new AuditEvent({
      date: new Date(),
      description: `User with email ${email} has logged out.`,
      type: 'Logout'
    });
    event.save((err) => {
      if (err) {
        console.error(err);
      }
    });
  }
  

  // Save an update event to the database
  function saveUpdateEvent(email,username) {
    const event = new AuditEvent({
      date: new Date(),
      description: `User with email ${email} has updated their profile.`,
      email: email,
      username: username,
      type: 'Update'
    });
    event.save((err) => {
      if (err) {
        console.error(err);
      }
    });
  }
  

  // Save a registration event to the database
  function saveRegistrationEvent(email,username) {
    const event = new AuditEvent({
      date: new Date(),
      description: `A new user with email ${email} has registered.`,
      email: email,
      username: username,
      type: 'Registration'
    });
    event.save((err) => {
      if (err) {
        console.error(err);
      }
    });
  }
 

 // Add a route to display the audit trail view
 app.get('/audit-trail/:page', isLoggedIn,(req, res) => {
    // Calculate the total number of pages
    const page = req.params.page;
    console.log(`The page from audit-trail/:page is ${page}`);
    const perPage = 10;
   
    AuditEvent.count((err, count) => {
      if (err) {
        console.error(err);
        return res.send('Error');
      }
      console.log(`The page starts from page ${page}`);
      console.log(`The total items is ${count}`);
      console.log(`The items per page is ${perPage}`);
      const totalPages = Math.ceil(count / perPage);
      console.log(`The total pages is ${totalPages}`);
      // Fetch the audit events for the current page
      AuditEvent.find({})
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec((err, events) => {
          if (err) {
            console.error(err);
            return res.send('Error');
          }
          res.render('audit-trail', { user: req.user, events: events, page: page, totalPages: totalPages });
        });
    });
  });
  

// Middleware function to check if the user is logged in
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.send(`
                <head>
                <!-- Bootstrap CSS -->
                <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
                <!-- Bootstrap JavaScript -->
                <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js" integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV" crossorigin="anonymous"></script>
              </head>
              <div class="container mt-5">
  <div class="alert alert-success alert-dismissible fade show" role="alert" style="text-align: center">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
</div>

<script>
  var countDown = 5000 / 1000;  // convert milliseconds to seconds
  var intervalId = setInterval(function() {
    countDown--;
    document.getElementsByClassName("alert")[0].innerHTML = "You need to log in to continue. Redirecting you in " + countDown + " seconds." + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button>';
    if (countDown === 0) {
      clearInterval(intervalId);
      window.location.href = '/home';
    }
  }, 1000);
</script>


                `);
  }
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/home');
  }
  
// Start the server
const port_1 = 3000;
app.listen(port_1, () => {
  console.log( `App server is listening on port ${port_1}`);
});


const port_2 = 4000;
server.listen(port_2, () => {
  console.log( `Chat server is listening on port ${port_2}`);
});
