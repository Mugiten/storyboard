var express = require('express');
var router = express.Router();
var passport = require('passport');

const GOOGLE_CLIENT_ID = "164805079420-8527v7i39t6f8ud037jtithrgme1s59k.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "8cNs0PKSKXjnHJMPv36vTpET";
const cookieSession = require('cookie-session');

const path = require('path');
const dbPath = path.resolve(__dirname, '../storyboard.db');
var pro;

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(dbPath, (err) => {
  if (err){
    return console.error(err.message);
  }
});

router.use(cookieSession({
  name: 'session-name',
  keys: ['key1', 'key2']
}))

const checkUserLoggedIn = (req, res, next) => {
  req.user ? next(): res.sendStatus(401);
}

var GoogleStrategy = require('passport-google-oauth20').Strategy;

router.use(passport.initialize());
router.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log("Profile ID is: " + profile.displayName);
    db.get("SELECT * FROM users WHERE profileid=?", [profile.id], function(err, row){
      console.log("PROFILE ROW: " + row.id);
      pro = row.id; 
      if(err){
        console.error(err.message);
      }
      console.log("USER REACHES HERE.");
      if(!row){
        console.log("INSERTED INTO PROFILE")
        db.run("INSERT INTO users(profileid) VALUES(?)", [profile.id], function(err){
          if(err){
            console.error(err.message);
          }
        }); 
      }
      return cb(err, row);
    });
  }
));



router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email', 'openid'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/storyboard_selection/');
  });
  
  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });
  
  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
  });
  

/* GET home page. */
router.get('/', checkUserLoggedIn ,function(req, res, next) {
  //const storyboards = await db.select('SELECT * FROM STORYBOARD WHERE USER_ID = ?');
    //res.json({ user: req.user });
    res.render('index', { title: 'Exprooss'});
});

router.get('/testing', (req, res, next) => {
  res.render('testing');
});

router.post("/post-button", (req, res, next) => {
  //let tableid = 0;
  db.run("INSERT INTO scene(orderid, title, body, location, pov, storyboardid) VALUES(?, ?, ?, ?, ?, ?)", [req.body.orderid ,req.body.title, req.body.body, req.body.location, req.body.pov, req.body.storyboardid], function(err) {
    if(err){
      console.log("This failed." + req.body.storyboardid);
      return console.error(err.message);
    }
    let sceneids = this.lastID;
    console.log(req.body);
    console.log("successful insert of database: " + req.body.characters);
    //res.redirect("/storyboard");
    db.run("INSERT INTO character_scene(sceneid, characterid) VALUES(?, ?)", [sceneids, req.body.characters], function(err){
      if(err){
        res.status(500).end();
        return console.error(err.message);
      }
      let arr = {sceneid: sceneids}
      console.log("Scene id: " + sceneids);
      console.log("Succuessful insertion of character_scene in POST.")
      res.redirect("/storyboard/" + req.body.storyboardid);
      //res.json(arr);
    });
  });  

});

router.get("/storyboard_selection/", checkUserLoggedIn, (req, res, next) => {
    let srows;
    db.all("SELECT * FROM storyboard WHERE userid=?", [req.user.id], function(err, rows){
      if (err){
        res.status(500).end();
        return console.error(err.message);
      }
      console.log("Rows: " + rows)
      res.render('storyboard_selection', {array: rows});
    });
});

function dbAllPromise(statement, params = []) {
  return new Promise((resolve, reject) => {
    db.all(statement, params, function (error, results) {
      if (error) {
        reject(error);
      }
      resolve(results);
    });
  });
}

router.get("/logout", (req, res, next) => {
  req.session = null; 
  res.redirect("https://mail.google.com/mail/u/0/?logout&hl=en");
});

router.get("/storyboard/:id/", checkUserLoggedIn,(req, res, next) => {
  // console.log("REQ STORYBOARDID: " + req.storyboard);
  dbAllPromise("SELECT * FROM storyboard LEFT JOIN users ON users.id = storyboard.userid =? WHERE storyboardid=?", [req.user.id, req.params.id]).then(function(storyboards){
  // dbAllPromise("SELECT * FROM storyboard WHERE storyboardid=?", [req.params.id]).then(function(storyboards){
    if(storyboards.length === 0){
      console.log("404 reaches here");
      return res.status(404).send('Sorry, we cannot find that!');
    }
    
    Promise.all([
      dbAllPromise("SELECT * FROM character WHERE storyboardid=?", [req.params.id]),
      dbAllPromise("SELECT s.sceneid, s.orderid, s.title, s.body, s.location, s.pov, GROUP_CONCAT(cs.character_scene_id) AS character_scene_ids, GROUP_CONCAT(c.name, \"::::\") AS character_names FROM scene s LEFT OUTER JOIN character_scene cs ON s.sceneid = cs.sceneid LEFT OUTER JOIN character c ON cs.characterid = c.characterid WHERE s.storyboardid=? GROUP BY s.sceneid ORDER BY s.orderid", [req.params.id])
    ]).then(function ([characters, scenes]) {
      const lRows = [];

      for (let row of scenes) {
        const characterSceneIds = row.character_scene_ids?.split(',') || [];
        const characterNames = row.character_names?.split("::::") || [];
        row.characters = [];
        for (let i = 0; i<characterNames.length; i++) {
          let character = {
            characterSceneId: characterSceneIds[i],
            name: characterNames[i]
          };
          row.characters.push(character);
        }

        lRows.push(row);
      }
      console.log("LAST ID GET: " + this.lastID);
      console.log("GET ROWS: " + JSON.stringify(lRows, null, 2));

      res.render('storyboard', {myArray: lRows, cArray: characters, storyboardid: req.params.id});
    }).catch(function(error) {
      res.status(500).send('Something broke yo');
      console.log(error.message);
    });
  });
});


router.delete("/scene/:id", (req, res, next) => {
  console.log(req.params.id);
  db.run("DELETE FROM character_scene WHERE sceneid=?", req.params.id, function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
  });

  db.run("DELETE FROM scene WHERE sceneid=?", req.params.id, function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    res.json();
  });
});

router.delete("/remove-character/:id", (req, res, next)=>{
  db.run("DELETE FROM character_scene WHERE character_scene.sceneid = ? AND character_scene.characterid = ?", [req.body.id, req.body.characters], function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    res.json();
  });
});

router.delete("/remove-char/:id", (req, res, next)=>{
  db.run("DELETE FROM character_scene WHERE character_scene_id=?", req.params.id, function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    res.json();
  });
});

router.delete("/remove-storyboard/:id", (req, res, next)=>{
  db.run("DELETE FROM storyboard WHERE storyboardid=?", req.params.id, function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    res.json();
  });
});

router.put("/sceneedit/:id", (req, res, next) => {
  db.run("UPDATE scene SET title=?, orderid=?, body=?, location=?, pov=? WHERE sceneid=?", [req.body.title, req.body.orderid, req.body.body, req.body.location, req.body.pov, req.params.id], function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    console.log("success UPDATE!");
  });
});

router.post("/add-character", (req, res, next) =>{
  console.log("REG BODY: " + req.params.id);
  console.log(req.body);
  db.run("INSERT INTO character_scene(sceneid, characterid) VALUES(?, ?)", [req.body.id, req.body.characters], function(err){
    if(err){
      // res.status(500).end();
      res.locals.character_add_error = err.message;
      // return console.error(err.message);
    }
    // console.log("ADD BUTTON BODY: " + req.body);
    res.redirect("/storyboard/" + req.body.storyboardid);
  });
});

router.post("/post-storyboard", (req, res, next)=>{
  console.log("REQ PRO IS: " + pro);
  console.log("REQ.USER IS: " + req.user.id);
  db.run("INSERT INTO storyboard(name, author, userid) VALUES(?, ?, ?)", [req.body.name, req.body.author, req.user.id], function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    res.redirect("/storyboard_selection/");
  });
});

router.post("/post-character", (req, res, next) =>{
  db.run("INSERT INTO character(name, age, sex, relationship, history, abilities, storyboardid) VALUES(?, ?, ?, ?, ?, ?, ?)", [req.body.cname, req.body.age, req.body.relationship, req.body.sex, req.body.abilities, req.body.history, req.body.storyboardid], function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    console.log("Character Post!");
    //console.log("SELECT * FROM character");
    res.redirect("/storyboard/" + req.body.storyboardid);
  });
});


module.exports = router;


