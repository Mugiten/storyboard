var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var app = express();
var fs = require("fs");


// app.use(bodyParser.urlencoded({extended: false }));
app.use(express.json());
/* GET home page. */
router.get('/', function(req, res, next) {
  //const storyboards = await db.select('SELECT * FROM STORYBOARD WHERE USER_ID = ?');

  res.render('index', { title: 'Exprooss'});
});

router.get('/testing', (req, res, next) => {
  res.render('testing');
});

var scenearray = [{
    sceneid: 1,
    title: "Storyboard",
    body: "I am A.Wake",
    location: "Brightfalls",
    tags: ["Alan Wake", "Thomas Zane"],
    pov: "Alan Wake",
  }
];

router.get("/post", function(req, res, next){
  res.render("post");
});

router.post("/post-button", (req, res, next) => {
  scenearray.push({
    sceneid: scenearray.length + 1,
    title: req.body.title,
    body: req.body.body,
    location: req.body.location,
    tags: req.body.tags.split(","),
    pov: req.body.pov, 
  });

  fs.writeFile("storyboard.txt", JSON.stringify(scenearray), (err, data) => {
    if (err) {
      return console.log(err);
    }
    console.log(data);
  });
  res.redirect("/storyboard");
  res.status(200);
  res.end();
  console.log(req.body);
});

router.get("/storyboard", (req, res, next) => {
    res.render('storyboard', {myArray: scenearray})
});

app.use("/post", router);

fs.readFile("storyboard.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(JSON.parse(data));

});

router.delete("/scene/:id", (req, res, next) => {
  console.log(req.params.id);
  const index = scenearray.findIndex(function(element){
    return element.sceneid == req.params.id;
  });
  if(index == -1 ){
    console.log("Element with ID doesn't exist.");
    res.status(400).end();
    return;
  }
  let [removed] = scenearray.splice(index, 1);
  console.log(index);
  console.log(scenearray);
  res.json(removed);
  //res.redirect("/storyboard");
  //res.send("Delete Requestzzz");
});

router.put("/sceneedit/:id", (req, res, next) => {
  console.log("PID: " + req.params.id);
  const index = scenearray.findIndex(function(element){
    return element.id == req.params.id; 
  });
  //res.send("This is a post test.")
  //JSON.bodyParser(req.body);
  console.log("Index; " + index);
  const updated_scene = 
    {sceneid: req.params.id, title: req.body.title, body: req.body.body, location: req.body.location, tags: req.body.tags, pov: req.body.pov}
  
  scenearray.splice(req.params.id - 1, 1, updated_scene);
  // res.redirect("/storyboard");
  res.json(updated_scene);
  res.end();
});

module.exports = router;
