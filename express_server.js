
const express = require("express");
const app = express();
const PORT = 8080; 
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helper');
const salt = bcrypt.genSaltSync(10);


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
         name: "session",
         keys: ['key1,' , 'key2']
        }));

        

            

const urlDatabase = {
  "b2xVn2": {
    //shortURL: 'b2xVn2',
    longURL: "http://www.lighthouselabs.ca",
    userID: 'aJ481W'
  },

  "9sm5xK": {
    //shortURL: '9sm5xK',
    longURL: "http://www.google.com",
    userID: 'aJ481W'
  }
};

// users database
const userDB = {
  "userRandomID": {
    id: 'userID',
    email: 'userfan@email.com',
    password: 'yes'
  },
  "userRandomID": {
    id: 'userID',
    email: 'userfan2@email.com',
    password: 'yesagain'
  }
};

// get and post below 

app.get('/login', (req, res) => {
  const userID = req.session.user_id;
  let user = getUserById(userDB, userID);
  
  const templateVars = {user: user};
  

  res.render('login', templateVars);
})

app.get('/register', (req, res) => {
  const userID = req.session.user_id;
  let user = getUserById(userDB, userID);

  
  const templateVars = {user: user};
  res.render('register', templateVars)
})

app.get("/urls/new", (req, res) => {
  
  const userID = req.session.user_id;
  let user = getUserById(userDB, userID);

    const templateVars = {user};
  


    res.render("urls_new", templateVars)
})

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log('shortUrl', shortURL)
  const userID = req.session.user_id;
  console.log('USERid', userID)
  let user = getUserById(userDB, userID);
  console.log("urlDB", urlDatabase)
  
  if (userID !== urlDatabase[shortURL].userID) {
    return res.send('You can not view this Url')
  }
  const longURL = urlDatabase[shortURL]['longURL'];
  const templateVars = { 
    shortURL,
    longURL,
    user
  }

  res.render("urls_show", templateVars);
})

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL; 
  const longURL = urlDatabase[shortURL]['longURL']
  res.redirect(longURL);
  })

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
})


app.post("/urls", (req, res) => {
  const userID = req.session.user_id
  const longURL = req.body.longURL
  const shortURL = generateRandomString();
  
  urlDatabase[shortURL] = {
    userID,
    longURL
  }

  res.redirect(`/urls/${shortURL}`);
})

app.post('/urls/:shortURL/delete', (req, res) => {
  if(urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.send('You can not Delete this URL')
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
})
app.post("/urls/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.send('You can not Update this URL')
  }
  let shortURL = req.params.shortURL;
  let newLongURL = req.body.longURL
  urlDatabase[shortURL]['longURL']= newLongURL; 

  res.redirect('/urls');
})


app.post('/login', (req, res) => {
  const email = req.body.email;
  const hashedPassword = bcrypt.hashSync(req.body.password, salt);
  const user = getUserByEmail(email, userDB);
  if (user) {
    if (hashedPassword === user.password) {
      req.session.user_id = user.id
      res.redirect('/urls');
    } else {
      res.status(403).send('Sorry Try again <a href="/login">login</a>')
    }
  } else {
    res.status(403).send('Register <a href="/register">register</a> here!!')
  }
    console.log('user', user);
})
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login')
})
app.post('/register', (req, res) => {
  const email = req.body.email;
  const hashedPassword = bcrypt.hashSync(req.body.password, salt);
  if (email === '' && hashedPassword === '') {
    return res.status(400).send('Email & password cannot be empty')
  }
  const userFound = getUserByEmail(email, userDB);
  if (userFound) {
    res.status(400).send('That user already exists, try again');
    return;
  }
  const user = createUser(email, hashedPassword, userDB)
  
  req.session.user_id = user.id
  res.redirect('/urls')
})

const urlsForUser = function(userID) {
  let usersObject = {};
  for (const shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === userID) {
      usersObject[shortURL] = urlDatabase[shortURL]
    }
  }
  return usersObject;
}

const getUserById = function(userDB, userID) {
  if (userDB[userID]) {
    return userDB[userID]
  } else {
    return null;
  }
}

const createUser = function(email, hashpassword, users) {
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: email,
    password: hashpassword
  };
  return users[userID]
}

function generateRandomString() {
  let result = '';
  let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i ++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  if(!userDB[req.session.user_id]) {
    res.redirect('/login')

  }
  const userID = req.session.user_id;
  const templateVars = { 
    user: getUserById(userDB, userID),
    urls: urlsForUser(userID)
  };
  res.render("urls_index", templateVars)
})

// server

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});