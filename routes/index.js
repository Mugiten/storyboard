var express = require('express');
var router = express.Router();

const path = require('path');
const dbPath = path.resolve(__dirname, '../storyboard.db');

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(dbPath, (err) => {
  if (err){
    return console.error(err.message);
  }
  console.log("Connected to the test.db.");
});

/* GET home page. */
router.get('/', function(req, res, next) {
  //const storyboards = await db.select('SELECT * FROM STORYBOARD WHERE USER_ID = ?');

  res.render('index', { title: 'Exprooss'});
});

router.get('/testing', (req, res, next) => {
  res.render('testing');
});

router.post("/post-button", (req, res, next) => {
  //let tableid = 0;
  db.run("INSERT INTO scene(title, body, location, pov) VALUES(?, ?, ?, ?)", [req.body.title, req.body.body, req.body.location, req.body.pov], function(err) {
    if(err){
      console.log("This failed.");
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
      res.redirect("/storyboard");
      //res.json(arr);
    });
  });  

});

router.get("/storyboard", (req, res, next) => {
    let cRows;
    let sRows;
    let rRows;

    db.all("SELECT character.name, character_scene.sceneid, character_scene.character_scene_id FROM character LEFT OUTER JOIN character_scene on character_scene.characterid = character.characterid LEFT OUTER JOIN scene on scene.sceneid = character_scene.sceneid WHERE scene.sceneid = character_scene.sceneid ORDER BY character_scene.sceneid", function(err, rows){
      if(err){
        res.status(500).end();
        return console.error(err.message);
      }
      rRows = rows;
    });

    db.all("SELECT * FROM character", function(err, rows){
      if (err){
        res.status(500).end();
        return console.error(err.message);
      }

      cRows = rows;
    });

    db.all("SELECT s.sceneid, s.title, s.body, s.location, s.pov, GROUP_CONCAT(cs.character_scene_id) AS character_scene_ids, GROUP_CONCAT(c.name, \"::::\") AS character_names FROM scene s LEFT OUTER JOIN character_scene cs ON s.sceneid = cs.sceneid LEFT OUTER JOIN character c ON cs.characterid = c.characterid GROUP BY s.sceneid", function(err, rows){
      if(err){
        res.status(500).end();
        return console.error(err.message);
      }
      lRows = [];

      for (let row of rows) {
        console.log("")
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
      res.render('storyboard', {myArray: lRows, cArray: cRows, rArray: rRows});
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

router.put("/sceneedit/:id", (req, res, next) => {
  db.run("UPDATE scene SET title=?, body=?, location=?, pov=? WHERE sceneid=?", [req.body.title, req.body.body, req.body.location, req.body.pov, req.params.id], function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    console.log("success UPDATE!");
  });
});

router.post("/add-character", (req, res, next) =>{
  console.log("REG BODY: ");
  console.log(req.body);
  db.run("INSERT INTO character_scene(sceneid, characterid) VALUES(?, ?)", [req.body.id, req.body.characters], function(err){
    if(err){
      // res.status(500).end();
      res.locals.character_add_error = err.message;
      // return console.error(err.message);
    }
    // console.log("ADD BUTTON BODY: " + req.body);
    res.redirect("/storyboard");
  });
});


// router.put("/add-character/:id", (req, res, next) =>{
//   console.log(body);
//   db.run("INSERT INTO character_scene(sceneid, characterid) VALUES(?, ?)", [req.body.sceneid, req.body.characterid], function(err){
//     if(err){
//       res.status(500).end();
//       return console.error(err.message);
//     }
//     console.log("ADD BUTTON BODY: " + req.body);
//   
//   });
// });

router.post("/post-character", (req, res, next) =>{
  db.run("INSERT INTO character(name, age, sex, relationship, history, abilities) VALUES(?, ?, ?, ?, ?, ?)", [req.body.cname, req.body.age, req.body.relationship, req.body.abilities, req.body.history], function(err){
    if(err){
      res.status(500).end();
      return console.error(err.message);
    }
    console.log("Character Post!");
    //console.log("SELECT * FROM character");
    res.redirect("/storyboard");
  });
});


module.exports = router;


